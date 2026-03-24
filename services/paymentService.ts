// services/paymentService.ts

import { v4 as uuidv4 } from 'uuid';
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
// Returns the checkout config to pass to window.webpayCheckout().
// Also creates a pending Payment record in DB before the customer
// is shown the payment widget.

export async function initializeJobPayment(jobId: string, customerId: string) {
  await connectDB();

  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');
  if (job.customerId.toString() !== customerId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (job.status !== 'completed') {
    throw Object.assign(new Error('Job must be completed before payment'), { status: 400 });
  }

  const customer = await User.findById(customerId).lean();
  if (!customer) throw new Error('Customer not found');

  // Idempotency — if a pending payment already exists, return its config
  // so the customer can retry without creating a duplicate
  const existing = await Payment.findOne({ jobId, status: 'pending' });
  if (existing?.transactionReference) {
    const amountKobo = existing.amount * 100;
    const config = await buildCheckoutConfig({
      transactionRef:  existing.transactionReference,
      amountKobo,
      customerEmail:   customer.email,
      customerName:    customer.name,
      customerId,
      description:     `Payment for: ${job.title}`,
      callbackUrl:     `${env.appUrl}/payments/callback`,
    });
    return { config, transactionRef: existing.transactionReference, amountKobo };
  }

  // Generate unique transaction reference — prefix SC- for easy identification
  const transactionRef = `SC-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
  const amountKobo     = Math.round(job.price * 100); // NGN → kobo

  // Create pending Payment record BEFORE showing the widget
  // This ensures we have a record even if the customer closes the browser
  await Payment.create({
    jobId,
    workerId:             job.workerId,
    customerId,
    amount:               job.price,       // store in NGN
    currency:             'NGN',
    transactionReference: transactionRef,
    paymentGateway:       'interswitch',
    status:               'pending',
  });

  // Build the checkout config with a fresh access token
  const config = await buildCheckoutConfig({
    transactionRef,
    amountKobo,
    customerEmail: customer.email,
    customerName:  customer.name,
    customerId,
    description:   `Payment for: ${job.title}`,
    callbackUrl:   `${env.appUrl}/payments/callback`,
  });

  return { config, transactionRef, amountKobo };
}

// ── Verify and settle ─────────────────────────────────────────────
// MUST be called server-side before giving value.
// Called from:
//   1. POST /api/payments/verify — triggered by callback redirect
//   2. POST /api/payments/webhook — Interswitch async notification
//   3. Polling on the callback page if status is pending

export async function verifyAndSettlePayment(transactionRef: string) {
  await connectDB();

  const payment = await Payment.findOne({ transactionReference: transactionRef });
  if (!payment) throw new Error('Payment record not found');

  // Already settled — return current state (idempotent)
  if (payment.status === 'successful') {
    return { status: 'successful', payment };
  }

  // Amount in kobo for the verify call
  const expectedAmountKobo = Math.round(payment.amount * 100);

  // Server-side verify against Interswitch
  const result = await verifyTransaction(transactionRef, expectedAmountKobo);

  if (result.status === 'successful') {
    // 1. Update payment record
    payment.status        = 'successful';
    payment.paymentMethod = 'card'; // Interswitch doesn't always return this
    payment.paidAt        = result.transactionDate
      ? new Date(result.transactionDate)
      : new Date();
    await payment.save();

    // 2. Mark job as paid in the state machine
    await markJobPaid(payment.jobId.toString(), 'system');

    // 3. Update worker earnings
    await WorkerEarnings.findOneAndUpdate(
      { workerId: payment.workerId },
      {
        $inc: { totalEarnings: payment.amount, monthlyEarnings: payment.amount },
        $set: { lastPaymentDate: new Date() },
      },
      { upsert: true }
    );

    // 4. Recalculate trust score
    await onPaymentVerified(payment.workerId.toString());

    // 5. Notify worker
    const worker = await WorkerProfile.findById(payment.workerId);
    if (worker) {
      await Notification.create({
        userId:  worker.userId,
        title:   'Payment received',
        message: `₦${payment.amount.toLocaleString('en-NG')} received for your completed job`,
        type:    'payment',
      });
    }

  } else if (result.status === 'failed') {
    payment.status = 'failed';
    await payment.save();
  }

  return { status: result.status, payment };
}

// ── Worker payment history ────────────────────────────────────────
export async function getWorkerPaymentHistory(workerId: string, page = 1, limit = 20) {
  await connectDB();
  const skip     = (page - 1) * limit;
  const total    = await Payment.countDocuments({ workerId, status: 'successful' });
  const payments = await Payment.find({ workerId, status: 'successful' })
    .sort({ paidAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('jobId', 'title')
    .lean();
  return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}