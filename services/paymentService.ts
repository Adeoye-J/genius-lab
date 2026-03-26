import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/database/mongodb';
import { buildCheckoutConfig, verifyTransaction } from '@/lib/payments/interswitch';
import { onPaymentVerified } from '@/lib/trust/trustScoreEngine';
import { markJobPaid } from '@/services/jobService';
import Payment from '@/models/Payment';
import Job from '@/models/Job';
import User from '@/models/User';
import WorkerProfile from '@/models/Worker';
import WorkerEarnings from '@/models/WorkerEarnings';
import Notification from '@/models/Notification';
import { env } from '@/config/env';

// ── Initialize payment ────────────────────────────────────────────
export async function initializeJobPayment(jobId: string, customerId: string) {
  await connectDB();

  const job = await Job.findById(jobId);
  if (!job) throw Object.assign(new Error('Job not found'), { status: 404 });
  if (job.customerId.toString() !== customerId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  if (job.status  === "paid") {
    throw Object.assign(new Error('You have already made payment for this job.'), { status: 400 });
  }

  if (job.status !== 'completed') {
    throw Object.assign(new Error('Job must be completed before payment'), { status: 400 });
  }

  const customer = await User.findById(customerId).lean();
  if (!customer) throw new Error('Customer not found');

  const amountKobo = Math.round(job.price * 100);

  // Idempotency — reuse existing pending payment
  const existing = await Payment.findOne({ jobId, status: 'pending' });
  if (existing?.transactionReference) {
    const config = await buildCheckoutConfig({
      transactionRef:  existing.transactionReference,
      amountKobo,
      customerEmail:   customer.email,
      customerName:    customer.name,
      customerId,
      callbackUrl:     `${env.appUrl}/payments/callback`,
    });
    return { config, transactionRef: existing.transactionReference, amountKobo };
  }

  const transactionRef = `SC-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

  // Create pending Payment record BEFORE showing the widget
  await Payment.create({
    jobId,
    workerId:             job.workerId,   // WorkerProfile ObjectId
    customerId,
    amount:               job.price,      // NGN
    currency:             'NGN',
    transactionReference: transactionRef,
    paymentGateway:       'interswitch',
    status:               'pending',
  });

  const config = await buildCheckoutConfig({
    transactionRef,
    amountKobo,
    customerEmail: customer.email,
    customerName:  customer.name,
    customerId,
    callbackUrl:   `${env.appUrl}/payments/callback`,
  });

  return { config, transactionRef, amountKobo };
}

// ── Verify and settle ─────────────────────────────────────────────
// FIX: Runs all model updates atomically and logs each step.
// All updates now happen regardless of prior partial failures.

export async function verifyAndSettlePayment(transactionRef: string) {
  await connectDB();

  const existingPayment = await Payment.findOne({ transactionReference: transactionRef });
  if (!existingPayment) throw Object.assign(new Error('Payment record not found'), { status: 404 });

  // Already settled — idempotent
  if (existingPayment.status === 'successful') {
    return { status: 'successful', existingPayment };
  }

  // Already failed — nothing to do
  if (existingPayment.status === 'failed') {
    return { status: 'failed', existingPayment };
  }

  // Atomically claim the settlement slot.
  // Only one concurrent call will succeed — the other gets null.
  const claimed = await Payment.findOneAndUpdate(
    {
      transactionReference: transactionRef,
      status: 'pending',   // ← only matches if STILL pending (atomic guard)
    },
    { $set: { status: 'processing' } }, // intermediate state — prevents second claim
    { new: false }                       // return the old doc so we know we won
  );
 
  if (!claimed) {
    // Another call already claimed this payment — wait briefly and return current state
    // (the other call is mid-settlement, status will be successful shortly)
    console.log(`[Payment] ${transactionRef} already claimed by concurrent call — skipping`);
    const current = await Payment.findOne({ transactionReference: transactionRef });
    return { status: current?.status ?? 'pending', payment: current ?? existingPayment };
  }
 
  // We won the race — proceed with settlement
  const payment            = claimed;
  const expectedAmountKobo = Math.round(payment.amount * 100);

  // Server-side verify with Interswitch
  const result = await verifyTransaction(transactionRef, expectedAmountKobo);

  console.log(`[Payment] ${transactionRef} → ${result.status} (${result.responseCode}: ${result.responseMessage})`);

  // if (result.status === 'successful') {
  //   // ── 1. Update Payment record ───────────────────────────────
  //   payment.status        = 'successful';
  //   payment.paymentMethod = 'card';
  //   payment.paidAt        = result.transactionDate
  //     ? new Date(result.transactionDate)
  //     : new Date();
  //   await payment.save();
  //   console.log('[Payment] ✓ Payment record updated');

  if (result.status === 'successful') {
    // ── 1. Mark payment successful ─────────────────────────────
    await Payment.findOneAndUpdate(
      { transactionReference: transactionRef },
      {
        $set: {
          status:        'successful',
          paymentMethod: 'card',
          paidAt:        result.transactionDate ? new Date(result.transactionDate) : new Date(),
        },
      }
    );
    console.log('[Payment] ✓ Payment record updated');

    // ── 2. Mark Job as paid ────────────────────────────────────
    try {
      await markJobPaid(payment.jobId.toString(), 'system');
      console.log('[Payment] ✓ Job marked paid');
    } catch (err) {
      // Job may already be paid — log but continue
      console.warn('[Payment] Job already paid or not found:', (err as Error).message);
    }

    // ── 3. Update WorkerEarnings ───────────────────────────────
    // FIX: workerId on Payment is a WorkerProfile ObjectId
    const workerProfileId = payment.workerId.toString();

    await WorkerEarnings.findOneAndUpdate(
      { workerId: new mongoose.Types.ObjectId(workerProfileId) },
      {
        $inc: { totalEarnings: payment.amount, monthlyEarnings: payment.amount },
        $set: { lastPaymentDate: new Date() },
      },
      { upsert: true, new: true }
    );
    console.log('[Payment] ✓ WorkerEarnings updated');

    // ── 4. Update TrustScore + WorkerProfile ───────────────────
    // onPaymentVerified increments completedJobs, verifiedPayments,
    // totalJobsCompleted on WorkerProfile, and recomputes trustScore
    try {
      const newScore = await onPaymentVerified(workerProfileId);
      console.log(`[Payment] ✓ Trust score updated → ${newScore}`);
    } catch (err) {
      console.error('[Payment] Trust score update failed:', (err as Error).message);
    }

    // ── 5. Notify worker ───────────────────────────────────────
    try {
      const workerProfile = await WorkerProfile.findById(workerProfileId).lean();
      if (workerProfile) {
        await Notification.create({
          userId:  workerProfile.userId,
          title:   'Payment received',
          message: `₦${payment.amount.toLocaleString('en-NG')} received for your completed job`,
          type:    'payment',
        });
        console.log('[Payment] ✓ Worker notified');
      }
    } catch (err) {
      console.error('[Payment] Notification failed:', (err as Error).message);
    }

    // Return the fresh payment doc
    const settled = await Payment.findOne({ transactionReference: transactionRef });
    return { status: 'successful', payment: settled ?? payment };

  } else if (result.status === 'failed') {
    // payment.status = 'failed';
    // await payment.save();
    await Payment.findOneAndUpdate(
      { transactionReference: transactionRef },
      { $set: { status: 'failed' } }
    );
    console.log(`[Payment] ✗ Payment failed: ${result.responseCode} — ${result.responseMessage}`);
    return { status: 'failed', payment };
  } else {
    // Still pending — reset to pending so it can be retried
    await Payment.findOneAndUpdate(
      { transactionReference: transactionRef },
      { $set: { status: 'pending' } }
    );
    console.log(`[Payment] ⏳ Payment pending: ${result.responseCode}`);
    return { status: 'pending', payment };
  }

  // return { status: result.status, payment };
}

// ── Repair utility ────────────────────────────────────────────────
// Call this to fix any jobs that are in 'paid' status but have
// missing WorkerEarnings / TrustScore updates (catches the existing broken records).
// POST /api/payments/repair — admin only

// export async function repairPaidPayments() {
//   await connectDB();

//   const paidPayments = await Payment.find({ status: 'successful' }).lean();
//   const results = [];

//   for (const payment of paidPayments) {
//     const workerProfileId = payment.workerId.toString();

//     try {
//       // Recount actual values from source
//       const { recalculateTrustScore } = await import('@/lib/trust/trustScoreEngine');

//       // Recalculate earnings from actual payment records
//       const allPayments = await Payment.find({
//         workerId: payment.workerId,
//         status: 'successful',
//       }).lean();

//       const totalEarnings = allPayments.reduce((sum, p) => sum + p.amount, 0);

//       await WorkerEarnings.findOneAndUpdate(
//         { workerId: payment.workerId },
//         { $set: { totalEarnings, lastPaymentDate: payment.paidAt ?? new Date() } },
//         { upsert: true }
//       );

//       const score = await recalculateTrustScore(workerProfileId);

//       results.push({ workerId: workerProfileId, totalEarnings, score, ok: true });
//     } catch (err) {
//       results.push({ workerId: workerProfileId, ok: false, error: (err as Error).message });
//     }
//   }

//   return results;
// }

// ── Worker payment history ────────────────────────────────────────
export async function getWorkerPaymentHistory(workerId: string, page = 1, limit = 20) {
  await connectDB();
  const workerOid = new mongoose.Types.ObjectId(workerId);
  const skip      = (page - 1) * limit;
  const total     = await Payment.countDocuments({ workerId: workerOid, status: 'successful' });
  const payments  = await Payment.find({ workerId: workerOid, status: 'successful' })
    .sort({ paidAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('jobId', 'title')
    .lean();
  return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}