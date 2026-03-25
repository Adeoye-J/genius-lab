import mongoose from 'mongoose';
import { connectDB } from '@/lib/database/mongodb';
import TrustScore from '@/models/TrustScore';
import WorkerProfile from '@/models/Worker';
import { Review } from '@/models/Review';
import Payment from '@/models/Payment';

// ── Score formula ─────────────────────────────────────────────────
//  Completed jobs    → 0–40 pts  (capped at 50 jobs)
//  Verified payments → 0–30 pts  (capped at 50 payments)
//  Average rating    → 0–20 pts  (rating/5 × 20)
//  Dispute penalty   → 0–10 pts  (each dispute −5, max −10)

export async function computeTrustScore(workerId: string): Promise<number> {
  const ts = await TrustScore.findOne({ workerId });
  if (!ts) return 0;

  const jobPts     = Math.min((ts.completedJobs    / 50) * 40, 40);
  const payPts     = Math.min((ts.verifiedPayments  / 50) * 30, 30);
  const ratingPts  = (ts.averageRating / 5) * 20;
  const disputePen = Math.min(ts.disputeCount * 5, 10);

  return Math.max(0, Math.min(100, Math.round(jobPts + payPts + ratingPts - disputePen)));
}

// ── Full recalculation from source data ──────────────────────────
// Use after data migrations or to repair inconsistent state.

export async function recalculateTrustScore(workerId: string): Promise<number> {
  await connectDB();

  // FIX: Cast workerId to ObjectId for all aggregations and queries
  const workerOid = new mongoose.Types.ObjectId(workerId);

  const [verifiedPayments, completedJobsCount, ratingAgg] = await Promise.all([
    Payment.countDocuments({ workerId: workerOid, status: 'successful' }),
    // Count from WorkerProfile directly — it's the source of truth for completed jobs
    WorkerProfile.findById(workerOid).select('totalJobsCompleted').lean(),
    Review.aggregate([
      { $match: { workerId: workerOid } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]),
  ]);

  const averageRating  = Math.round((ratingAgg[0]?.avg ?? 0) * 10) / 10;
  const completedJobs  = completedJobsCount?.totalJobsCompleted ?? 0;

  // Update TrustScore doc with authoritative counts
  await TrustScore.findOneAndUpdate(
    { workerId: workerOid },
    { $set: { verifiedPayments, completedJobs, averageRating } },
    { upsert: true, new: true }
  );

  const score = await computeTrustScore(workerId);

  await Promise.all([
    TrustScore.findOneAndUpdate({ workerId: workerOid }, { $set: { score } }),
    WorkerProfile.findByIdAndUpdate(workerOid, { trustScore: score, averageRating }),
  ]);

  return score;
}

// ── Incremental update after a verified payment ───────────────────
// Called from paymentService after settlement succeeds.
// Increments both counters and recomputes score.

export async function onPaymentVerified(workerId: string): Promise<number> {
  await connectDB();

  const workerOid = new mongoose.Types.ObjectId(workerId);

  // FIX: Increment TrustScore counters
  await TrustScore.findOneAndUpdate(
    { workerId: workerOid },
    { $inc: { completedJobs: 1, verifiedPayments: 1 } },
    { upsert: true }
  );

  const score = await computeTrustScore(workerId);

  await Promise.all([
    TrustScore.findOneAndUpdate({ workerId: workerOid }, { $set: { score } }),
    // FIX: Also increment totalJobsCompleted on WorkerProfile
    WorkerProfile.findByIdAndUpdate(workerOid, {
      $inc: { totalJobsCompleted: 1 },
      $set: { trustScore: score },
    }),
  ]);

  return score;
}

// ── Incremental update after a review ────────────────────────────
export async function onReviewSubmitted(workerId: string): Promise<number> {
  await connectDB();

  // FIX: Cast to ObjectId for aggregation
  const workerOid = new mongoose.Types.ObjectId(workerId);

  const ratingAgg = await Review.aggregate([
    { $match: { workerId: workerOid } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  const avg = Math.round((ratingAgg[0]?.avg ?? 0) * 10) / 10;

  await TrustScore.findOneAndUpdate(
    { workerId: workerOid },
    { $set: { averageRating: avg } },
    { upsert: true }
  );

  const score = await computeTrustScore(workerId);

  await Promise.all([
    TrustScore.findOneAndUpdate({ workerId: workerOid }, { $set: { score } }),
    WorkerProfile.findByIdAndUpdate(workerOid, {
      trustScore: score,
      averageRating: avg,
    }),
  ]);

  return score;
}