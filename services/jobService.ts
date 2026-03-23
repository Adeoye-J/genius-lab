// Job state machine. Every transition is explicit.
// Rules are enforced here, not in the API route.

import mongoose from 'mongoose';
import { connectDB } from '@/lib/database/mongodb';
import Job, { IJob, JobStatus } from '@/models/Job';
import JobTimeline from '@/models/JobTimeline';
import WorkerProfile from '@/models/Worker';
import Notification from '@/models/Notification';

// ── Valid transitions map ────────────────────────────────────────
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  requested:   ['accepted', 'cancelled'],
  accepted:    ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   ['paid'],       // system only — triggered by payment verification
  paid:        [],             // terminal
  cancelled:   [],             // terminal
};

function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Create job ───────────────────────────────────────────────────
export async function createJob(params: {
  title: string;
  description?: string;
  workerId: string;
  customerId: string;
  price: number;
  location?: { address?: string; city?: string; state?: string };
  scheduledDate?: string;
}) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(params.workerId)) {
    throw new Error('Invalid worker ID');
  }

  const worker = await WorkerProfile.findById(params.workerId);
  if (!worker) throw new Error('Worker not found');
  if (!worker.isAvailable) throw new Error('This worker is not currently available');

  const job = await Job.create({
    title:         params.title.trim(),
    description:   params.description?.trim() ?? '',
    workerId:      params.workerId,
    customerId:    params.customerId,
    price:         params.price,
    location:      params.location ?? {},
    scheduledDate: params.scheduledDate ? new Date(params.scheduledDate) : undefined,
    status:        'requested',
  });

  // Timeline entry
  await JobTimeline.create({
    jobId:     job._id,
    status:    'requested',
    updatedBy: params.customerId,
    notes:     'Job request created by customer',
  });

  // Notify the worker
  await Notification.create({
    userId:  worker.userId,
    title:   'New job request',
    message: `${params.title} — ₦${params.price.toLocaleString('en-NG')}`,
    type:    'job',
  });

  return job;
}

// ── Generic transition helper ────────────────────────────────────
async function transitionJob(
  jobId: string,
  actorId: string,
  toStatus: JobStatus,
  notes: string
): Promise<IJob> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(jobId)) throw new Error('Invalid job ID');

  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  if (!canTransition(job.status, toStatus)) {
    throw new Error(`Cannot move job from "${job.status}" to "${toStatus}"`);
  }

  job.status = toStatus;
  if (toStatus === 'completed') job.completedAt = new Date();
  await job.save();

  await JobTimeline.create({ jobId, status: toStatus, updatedBy: actorId, notes });

  return job;
}

// ── Accept ───────────────────────────────────────────────────────
export async function acceptJob(jobId: string, workerId: string) {
  const job = await Job.findById(jobId).populate('workerId');
  if (!job) throw new Error('Job not found');

  // Verify actor is the assigned worker
  const profile = await WorkerProfile.findOne({ userId: workerId });
  if (!profile || profile._id.toString() !== job.workerId.toString()) {
    throw new Error('Forbidden: only the assigned worker can accept this job');
  }

  const updated = await transitionJob(jobId, workerId, 'accepted', 'Worker accepted the job');

  // Notify customer
  await Notification.create({
    userId:  job.customerId,
    title:   'Job accepted',
    message: `Your job request "${job.title}" has been accepted`,
    type:    'job',
  });

  return updated;
}

// ── Start (in_progress) ──────────────────────────────────────────
export async function startJob(jobId: string, workerId: string) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  const profile = await WorkerProfile.findOne({ userId: workerId });
  if (!profile || profile._id.toString() !== job.workerId.toString()) {
    throw new Error('Forbidden: only the assigned worker can start this job');
  }

  const updated = await transitionJob(jobId, workerId, 'in_progress', 'Worker started the job');

  await Notification.create({
    userId:  job.customerId,
    title:   'Job started',
    message: `Work has begun on "${job.title}"`,
    type:    'job',
  });

  return updated;
}

// ── Complete ─────────────────────────────────────────────────────
export async function completeJob(jobId: string, workerId: string) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  const profile = await WorkerProfile.findOne({ userId: workerId });
  if (!profile || profile._id.toString() !== job.workerId.toString()) {
    throw new Error('Forbidden: only the assigned worker can mark this job complete');
  }

  const updated = await transitionJob(jobId, workerId, 'completed', 'Worker marked job as complete');

  // Notify customer — prompt them to pay
  await Notification.create({
    userId:  job.customerId,
    title:   'Job completed — payment required',
    message: `"${job.title}" is complete. Please make payment of ₦${job.price.toLocaleString('en-NG')}`,
    type:    'payment',
  });

  return updated;
}

// ── Cancel ───────────────────────────────────────────────────────
export async function cancelJob(jobId: string, actorId: string, reason?: string) {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  // Either the customer or the assigned worker can cancel (before in_progress completes)
  const profile = await WorkerProfile.findOne({ userId: actorId });
  const isWorker   = profile && profile._id.toString() === job.workerId.toString();
  const isCustomer = job.customerId.toString() === actorId;

  if (!isWorker && !isCustomer) {
    throw new Error('Forbidden: you are not a party to this job');
  }

  const updated = await transitionJob(
    jobId, actorId, 'cancelled',
    reason ? `Cancelled: ${reason}` : 'Job cancelled'
  );

  // Notify the other party
  const notifyUserId = isWorker ? job.customerId.toString() : profile!.userId.toString();
  await Notification.create({
    userId:  notifyUserId,
    title:   'Job cancelled',
    message: `"${job.title}" has been cancelled${reason ? `: ${reason}` : ''}`,
    type:    'job',
  });

  return updated;
}

// ── Mark paid (system call from payment verification) ────────────
export async function markJobPaid(jobId: string, systemUserId: string) {
  return transitionJob(jobId, systemUserId, 'paid', 'Payment verified — job marked as paid');
}

// ── List jobs (filterable) ───────────────────────────────────────
export async function listJobs(filters: {
  workerId?: string;
  customerId?: string;
  status?: JobStatus | JobStatus[];
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const { workerId, customerId, status, page = 1, limit = 20 } = filters;
  const query: mongoose.FilterQuery<IJob> = {};

  if (workerId)   query.workerId   = workerId;
  if (customerId) query.customerId = customerId;
  if (status)     query.status     = Array.isArray(status) ? { $in: status } : status;

  const skip  = (page - 1) * limit;
  const total = await Job.countDocuments(query);

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('workerId', 'profession trustScore averageRating')
    .populate('customerId', 'name')
    .lean();

  return { jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

// ── Get single job with timeline ─────────────────────────────────
export async function getJobWithTimeline(jobId: string) {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(jobId)) return null;

  const [job, timeline] = await Promise.all([
    Job.findById(jobId)
      .populate('workerId', 'profession trustScore averageRating location')
      .populate('customerId', 'name')
      .lean(),
    JobTimeline.find({ jobId }).sort({ createdAt: 1 }).lean(),
  ]);

  if (!job) return null;
  return { ...job, timeline };
}