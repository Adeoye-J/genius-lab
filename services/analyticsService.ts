
// Aggregates data from Job, Payment, Review, TrustScore collections
// into time-series and summary metrics for the worker analytics dashboard.

import mongoose, {PipelineStage} from 'mongoose';
import { connectDB } from '@/lib/database/mongodb';
import Job from '@/models/Job';
import Payment from '@/models/Payment';
import { Review } from '@/models/Review';
import TrustScore from '@/models/TrustScore';
import WorkerEarnings from '@/models/WorkerEarnings';

// ── Monthly earnings for a bar chart ────────────────────────────
// Returns last N months as { month: 'Jan 25', earnings: 45000 }
export async function getMonthlyEarnings(workerId: string, months = 6) {
  await connectDB();

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        workerId: new mongoose.Types.ObjectId(workerId),
        status:   'successful',
        paidAt:   { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year:  '$paidAt' },
          month: { $month: '$paidAt' },
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];

  const raw = await Payment.aggregate(pipeline);

  // Build a full array of all N months (fills 0 for months with no data)
  const results: { month: string; earnings: number; jobs: number }[] = [];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    const found = raw.find((r) => r._id.year === y && r._id.month === m);
    results.push({
      month:    `${MONTHS[m - 1]} ${String(y).slice(2)}`,
      earnings: found?.total ?? 0,
      jobs:     found?.count ?? 0,
    });
  }

  return results;
}

// ── Jobs per status breakdown ────────────────────────────────────
export async function getJobStatusBreakdown(workerId: string) {
  await connectDB();

  const pipeline: PipelineStage[] = [
    { $match: { workerId: new mongoose.Types.ObjectId(workerId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ];

  const raw = await Job.aggregate(pipeline);

  const statuses = ['requested','accepted','in_progress','completed','paid','cancelled'];
  return statuses.map((s) => ({
    status: s,
    count:  raw.find((r) => r._id === s)?.count ?? 0,
  }));
}

// ── Rating trend — average rating per month ──────────────────────
export async function getRatingTrend(workerId: string, months = 6) {
  await connectDB();

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        workerId: new mongoose.Types.ObjectId(workerId),
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year:  '$createdAt' },
          month: { $month: '$createdAt' },
        },
        avgRating: { $avg: '$rating' },
        count:     { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];

  const raw = await Review.aggregate(pipeline);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const results: { month: string; rating: number; count: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const found = raw.find((r) => r._id.year === y && r._id.month === m);
    results.push({
      month:  `${MONTHS[m - 1]} ${String(y).slice(2)}`,
      rating: found ? Math.round(found.avgRating * 10) / 10 : 0,
      count:  found?.count ?? 0,
    });
  }

  return results;
}

// ── Full worker analytics bundle ─────────────────────────────────
export async function getWorkerAnalytics(workerId: string) {
  await connectDB();

  const [monthly, statusBreakdown, ratingTrend, trustScore, earnings] = await Promise.all([
    getMonthlyEarnings(workerId),
    getJobStatusBreakdown(workerId),
    getRatingTrend(workerId),
    TrustScore.findOne({ workerId }).lean(),
    WorkerEarnings.findOne({ workerId }).lean(),
  ]);

  // Total lifetime stats
  const totalEarnings = monthly.reduce((s, m) => s + m.earnings, 0);
  const totalJobs     = statusBreakdown.find((s) => s.status === 'paid')?.count ?? 0;

  return {
    monthly,
    statusBreakdown,
    ratingTrend,
    trustScore:       trustScore?.score             ?? 0,
    completedJobs:    trustScore?.completedJobs      ?? 0,
    verifiedPayments: trustScore?.verifiedPayments   ?? 0,
    averageRating:    trustScore?.averageRating       ?? 0,
    disputeCount:     trustScore?.disputeCount        ?? 0,
    totalEarnings:    earnings?.totalEarnings         ?? totalEarnings,
    monthlyEarnings:  earnings?.monthlyEarnings       ?? 0,
  };
}