'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, Clock, MapPin, User, Star, CheckCircle2, Clock3, AlertCircle } from 'lucide-react';

interface TimelineEntry {
  _id: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface JobDetail {
  _id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  scheduledDate?: string;
  completedAt?: string;
  createdAt: string;
  workerId: { _id: string; profession: string; trustScore: number; averageRating: number; location: { city: string; state: string } };
  customerId: { _id: string; name: string };
  timeline: TimelineEntry[];
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'Request sent', accepted: 'Accepted', in_progress: 'Work started',
  completed: 'Work complete', paid: 'Payment confirmed', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  requested: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📨' },
  accepted: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '✓' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⚙' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', icon: '✓' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✓' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: '✗' },
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [actioning, setActioning] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(false);

  const fetchJob = useCallback(async () => {
    const [meRes, jobRes, revStat] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch(`/api/jobs/${jobId}`).then((r) => r.json()),
      fetch(`/api/reviews/job/${jobId}`).then((r) => r.json()),
    ]);
    if (meRes.success) setMe({ id: meRes.data.user.id, role: meRes.data.user.role });
    if (jobRes.success) setJob(jobRes.data);
    if (revStat.data) setReviewStatus(true);
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  async function doAction(action: string) {
    setActioning(true);
    await fetch(`/api/jobs/${jobId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    await fetchJob();
    setActioning(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center text-center py-16">
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading job details...</p>
          </div>
        </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center space-y-4 bg-white rounded-2xl p-8 border border-slate-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="text-lg font-semibold text-slate-900 mb-1">Job not found</p>
            <p className="text-sm text-slate-600">The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            <ChevronLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isWorker = me?.role === 'worker';
  const isCustomer = me?.role === 'customer';
  const backHref = isWorker ? '/dashboard/worker/jobs' : '/dashboard/customer/history';
  const statusColor = STATUS_COLORS[job.status] || { bg: 'bg-slate-50', text: 'text-slate-700', icon: '•' };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="w-px h-5 bg-slate-300" />
          <span className="text-sm font-semibold text-slate-900">Job #{jobId.slice(-6).toUpperCase()}</span>
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
              {STATUS_LABELS[job.status] ?? job.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Main Job Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
                <p className="text-slate-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                  {job.workerId.profession} • {job.workerId.location.city}, {job.workerId.location.state}
                </p>
              </div>
              <div className="shrink-0 text-right lg:text-left">
                <p className="text-4xl font-bold text-slate-900">₦{job.price.toLocaleString('en-NG')}</p>
                <p className="text-xs text-slate-500 mt-1">Total price</p>
              </div>
            </div>

            {job.description && (
              <div className="mb-6 pb-6 border-b border-slate-200">
                <p className="text-slate-700 leading-relaxed text-base">{job.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Customer</p>
                  <p className="text-sm font-medium text-slate-900">{job.customerId.name}</p>
                </div>
              </div>
              {job.scheduledDate && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Scheduled</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(job.scheduledDate).toDateString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Posted</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(job.createdAt).toDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review Button */}
        {job.status === 'paid' && (
          <Link
            href={`/payments/review?jobId=${jobId}`}
            className="w-full bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
          >
            <Star size={20} />
            Leave a review for this worker
          </Link>
        )}

        {/* Action Card */}
        {job.status !== 'paid' && job.status !== 'cancelled' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Current status</p>
                <p className="text-lg font-semibold text-slate-900">{STATUS_LABELS[job.status] ?? job.status}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {isWorker && job.status === 'requested' && (
                  <>
                    <button
                      onClick={() => doAction('cancel')}
                      disabled={actioning}
                      className="px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => doAction('accept')}
                      disabled={actioning}
                      className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {actioning ? 'Processing...' : 'Accept job'}
                    </button>
                  </>
                )}
                {isWorker && job.status === 'accepted' && (
                  <button
                    onClick={() => doAction('start')}
                    disabled={actioning}
                    className="px-6 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {actioning ? 'Processing...' : 'Mark as started'}
                  </button>
                )}
                {isWorker && job.status === 'in_progress' && (
                  <button
                    onClick={() => doAction('complete')}
                    disabled={actioning}
                    className="px-6 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {actioning ? 'Processing...' : 'Mark as complete'}
                  </button>
                )}
                {isCustomer && job.status === 'completed' && (
                  <Link
                    href={`/payments/pay?jobId=${job._id}`}
                    className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 inline-block"
                  >
                    Pay now
                  </Link>
                )}
                {['requested', 'accepted'].includes(job.status) && (
                  <button
                    onClick={() => doAction('cancel')}
                    disabled={actioning}
                    className="px-4 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all"
                  >
                    Cancel job
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-8">Job timeline</h2>
          <div className="space-y-6">
            {job.timeline.map((entry, i) => (
              <div key={entry._id} className="flex gap-4">
                {/* Timeline dot and connector */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center shrink-0 text-blue-600 font-bold text-sm">
                    {i + 1}
                  </div>
                  {i < job.timeline.length - 1 && (
                    <div className="w-0.5 h-12 bg-slate-200 mt-3" />
                  )}
                </div>

                {/* Timeline content */}
                <div className="pt-1 flex-1 pb-4">
                  <p className="font-semibold text-slate-900 text-base">
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-slate-600 mt-1">{entry.notes}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Clock3 size={14} />
                    {new Date(entry.createdAt).toLocaleString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
