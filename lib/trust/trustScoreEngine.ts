
// Called after every verified payment and every review submission.
// Reads TrustScore doc → computes → saves to TrustScore + mirrors to WorkerProfile.

import { connectDB } from '@/lib/database/mongodb';
import TrustScore from '@/models/TrustScore';
import WorkerProfile from '@/models/Worker';
import { Review } from '@/models/Review';
import Payment from '@/models/Payment';

// ── Score formula ────────────────────────────────────────────────
//
//  Component         Weight   Max pts   Notes
//  ─────────────────────────────────────────────────────────────
//  Completed jobs    40%      40 pts    Capped at 50 jobs for full score
//  Verified payments 30%      30 pts    Capped at 50 payments
//  Average rating    20%      20 pts    (rating / 5) × 20
//  Dispute penalty   −10%     −10 pts   Each dispute costs 5 pts, max −10
//
//  Final: clamp(sum, 0, 100) — always an integer

export async function computeTrustScore(workerId: string): Promise<number> {
  const ts = await TrustScore.findOne({ workerId });
  if (!ts) return 0;

  const jobPts      = Math.min((ts.completedJobs   / 50) * 40, 40);
  const payPts      = Math.min((ts.verifiedPayments / 50) * 30, 30);
  const ratingPts   = (ts.averageRating / 5) * 20;
  const disputePen  = Math.min(ts.disputeCount * 5, 10);

  return Math.max(0, Math.min(100, Math.round(jobPts + payPts + ratingPts - disputePen)));
}

// ── Full recalculation from source data ──────────────────────────
// Call this whenever you want the score to reflect the live DB state.
// More expensive than the incremental updates below, but authoritative.

export async function recalculateTrustScore(workerId: string): Promise<number> {
  await connectDB();

  // 1. Count verified payments
  const verifiedPayments = await Payment.countDocuments({
    workerId,
    status: 'successful',
  });

  // 2. Recalculate average rating from all reviews
  const ratingAgg = await Review.aggregate([
    { $match: { workerId: workerId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const averageRating = ratingAgg[0]?.avg ?? 0;

  // 3. Update TrustScore doc with fresh counts
  const ts = await TrustScore.findOneAndUpdate(
    { workerId },
    {
      $set: {
        verifiedPayments,
        averageRating: Math.round(averageRating * 10) / 10, // 1 decimal
      },
    },
    { new: true }
  );

  if (!ts) return 0;

  // 4. Compute and save score
  const score = await computeTrustScore(workerId);
  await TrustScore.findByIdAndUpdate(ts._id, { score });
  await WorkerProfile.findByIdAndUpdate(workerId, {
    trustScore:    score,
    averageRating: Math.round(averageRating * 10) / 10,
  });

  return score;
}

// ── Incremental update after a payment ───────────────────────────
// Faster than full recalc — just increments the counters.

export async function onPaymentVerified(workerId: string): Promise<number> {
  await connectDB();

  await TrustScore.findOneAndUpdate(
    { workerId },
    { $inc: { completedJobs: 1, verifiedPayments: 1 } },
    { upsert: true }
  );

  const score = await computeTrustScore(workerId);
  await TrustScore.findOneAndUpdate({ workerId }, { score });
  await WorkerProfile.findByIdAndUpdate(workerId, { trustScore: score });

  return score;
}

// ── Incremental update after a review ────────────────────────────
export async function onReviewSubmitted(workerId: string): Promise<number> {
  await connectDB();

  // Recompute average rating from all reviews (accurate, small collection)
  const ratingAgg = await Review.aggregate([
    { $match: { workerId } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  const avg = Math.round((ratingAgg[0]?.avg ?? 0) * 10) / 10;

  await TrustScore.findOneAndUpdate(
    { workerId },
    { $set: { averageRating: avg } },
    { upsert: true }
  );

  const score = await computeTrustScore(workerId);
  await TrustScore.findOneAndUpdate({ workerId }, { score });
  await WorkerProfile.findByIdAndUpdate(workerId, { trustScore: score, averageRating: avg });

  return score;
}