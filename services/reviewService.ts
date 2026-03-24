

import { connectDB } from '@/lib/database/mongodb';
import { Review } from '@/models/Review';
import Job from '@/models/Job';
import WorkerProfile from '@/models/Worker';
import { onReviewSubmitted } from '@/lib/trust/trustScoreEngine';

export async function createReview(params: {
  jobId: string;
  customerId: string;
  rating: number;
  comment?: string;
}) {
  await connectDB();

  const { jobId, customerId, rating, comment } = params;

  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');
  if (job.customerId.toString() !== customerId) throw new Error('Only the customer can review this job');
  if (job.status !== 'paid') throw new Error('Job must be paid before leaving a review');

  // Prevent duplicate reviews
  const existing = await Review.findOne({ jobId });
  if (existing) throw new Error('You have already reviewed this job');

  const review = await Review.create({
    jobId,
    workerId:   job.workerId,
    customerId,
    rating,
    comment:    comment?.trim() ?? '',
  });

  // Update trust score and average rating
  await onReviewSubmitted(job.workerId.toString());

  return review;
}

export async function getWorkerReviews(workerId: string, page = 1, limit = 10) {
  await connectDB();
  const skip  = (page - 1) * limit;
  const total = await Review.countDocuments({ workerId });
  const reviews = await Review.find({ workerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('customerId', 'name')
    .populate('jobId', 'title')
    .lean();
  return { reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}