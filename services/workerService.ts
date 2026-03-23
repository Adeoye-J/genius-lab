// All worker-related business logic lives here.
// API routes call these functions — keeps routes thin and logic testable.

import mongoose from 'mongoose';
import { connectDB } from '@/lib/database/mongodb';
import WorkerProfile, { IWorkerProfile } from '@/models/Worker';
import WorkerEarnings from '@/models/WorkerEarnings';
import TrustScore from '@/models/TrustScore';
import Job from '@/models/Job';

export interface WorkerListFilters {
  profession?: string;
  state?: string;
  city?: string;
  minTrustScore?: number;
  available?: boolean;
  page?: number;
  limit?: number;
}

// ── List workers (public directory) ─────────────────────────────
export async function listWorkers(filters: WorkerListFilters = {}) {
  await connectDB();

  const {
    profession,
    state,
    city,
    minTrustScore = 0,
    available,
    page  = 1,
    limit = 12,
  } = filters;

  const query: mongoose.FilterQuery<IWorkerProfile> = {
    trustScore: { $gte: minTrustScore },
  };

  if (profession) query.profession = { $regex: profession, $options: 'i' };
  if (state)      query['location.state'] = state;
  if (city)       query['location.city']  = { $regex: city, $options: 'i' };
  if (available !== undefined) query.isAvailable = available;

  const skip  = (page - 1) * limit;
  const total = await WorkerProfile.countDocuments(query);

  const workers = await WorkerProfile.find(query)
    .sort({ trustScore: -1, averageRating: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name profileImage')
    .lean();

  return {
    workers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ── Get single worker by ID ──────────────────────────────────────
export async function getWorkerById(workerId: string) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(workerId)) return null;

  const worker = await WorkerProfile.findById(workerId)
    .populate('userId', 'name profileImage createdAt')
    .lean();

  return worker;
}

// ── Get worker profile by userId ─────────────────────────────────
export async function getWorkerByUserId(userId: string) {
  await connectDB();
  return WorkerProfile.findOne({ userId }).lean();
}

// ── Update worker profile ────────────────────────────────────────
export async function updateWorkerProfile(
  userId: string,
  updates: Partial<Pick<IWorkerProfile, 'profession' | 'skills' | 'bio' | 'location' | 'yearsOfExperience' | 'isAvailable'>>
) {
  await connectDB();

  const worker = await WorkerProfile.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  return worker;
}

// ── Get worker dashboard stats ───────────────────────────────────
export async function getWorkerDashboardStats(workerId: string) {
  await connectDB();

  const [earnings, pendingCount, activeCount] = await Promise.all([
    WorkerEarnings.findOne({ workerId }).lean(),
    Job.countDocuments({ workerId, status: 'requested' }),
    Job.countDocuments({ workerId, status: { $in: ['accepted', 'in_progress'] } }),
  ]);

  return {
    earnings:    earnings ?? { totalEarnings: 0, monthlyEarnings: 0 },
    pendingJobs: pendingCount,
    activeJobs:  activeCount,
  };
}

// ── Recalculate trust score (called from payment + review events) ─
export async function recalculateTrustScore(workerId: string) {
  await connectDB();

  const ts = await TrustScore.findOne({ workerId });
  if (!ts) return;

  // Formula (weights in config/constants.ts):
  // completedJobs  → 0-40 pts  (capped at 50 jobs = full score)
  // verifiedPayments → 0-30 pts
  // averageRating  → 0-20 pts  (rating/5 * 20)
  // disputePenalty → up to -10 pts

  const jobPoints      = Math.min((ts.completedJobs   / 50)  * 40, 40);
  const paymentPoints  = Math.min((ts.verifiedPayments / 50)  * 30, 30);
  const ratingPoints   = (ts.averageRating / 5) * 20;
  const disputePenalty = Math.min(ts.disputeCount * 5, 10);

  const score = Math.max(0, Math.min(100, Math.round(
    jobPoints + paymentPoints + ratingPoints - disputePenalty
  )));

  ts.score = score;
  await ts.save();

  // Mirror to WorkerProfile for quick access
  await WorkerProfile.findByIdAndUpdate(workerId, { trustScore: score });

  return score;
}