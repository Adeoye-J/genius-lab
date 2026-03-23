'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router    = useRouter();

  const [job, setJob]         = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe]           = useState<{ id: string; role: string } | null>(null);
  const [actioning, setActioning] = useState(false);

  const fetchJob = useCallback(async () => {
    const [meRes, jobRes] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch(`/api/jobs/${jobId}`).then((r) => r.json()),
    ]);
    if (meRes.success) setMe({ id: meRes.data.user.id, role: meRes.data.user.role });
    if (jobRes.success) setJob(jobRes.data);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  async function doAction(action: string) {
    setActioning(true);
    await fetch(`/api/jobs/${jobId}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await fetchJob();
    setActioning(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground mb-2">Job not found</p>
          <button onClick={() => router.back()} className="text-primary hover:underline text-sm">← Go back</button>
        </div>
      </div>
    );
  }

  const isWorker   = me?.role === 'worker';
  const isCustomer = me?.role === 'customer';

  const backHref = isWorker ? '/dashboard/worker/jobs' : '/dashboard/customer/history';

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <Link href={backHref} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back
        </Link>
        <div className="w-px h-4 bg-border" />
        <span className="text-sm font-medium text-foreground">Job #{jobId.slice(-6).toUpperCase()}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Header card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">{job.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {job.workerId.profession} · {job.workerId.location.city}, {job.workerId.location.state}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-extrabold text-foreground">₦{job.price.toLocaleString('en-NG')}</p>
            </div>
          </div>

          {job.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{job.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span>Customer: <strong className="text-foreground">{job.customerId.name}</strong></span>
            {job.scheduledDate && (
              <span>Scheduled: <strong className="text-foreground">
                {new Date(job.scheduledDate).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </strong></span>
            )}
            <span>Created: <strong className="text-foreground">
              {new Date(job.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </strong></span>
          </div>
        </div>

        {/* Action card */}
        {job.status !== 'paid' && job.status !== 'cancelled' && (
          <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Current status</p>
              <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[job.status] ?? job.status}</p>
            </div>
            <div className="flex gap-2">
              {isWorker && job.status === 'requested' && (
                <>
                  <button onClick={() => doAction('cancel')} disabled={actioning}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted disabled:opacity-60 transition-all">
                    Decline
                  </button>
                  <button onClick={() => doAction('accept')} disabled={actioning}
                    className="px-4 py-2 text-sm font-semibold bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-60 transition-all">
                    {actioning ? '…' : 'Accept job'}
                  </button>
                </>
              )}
              {isWorker && job.status === 'accepted' && (
                <button onClick={() => doAction('start')} disabled={actioning}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-all">
                  {actioning ? '…' : 'Mark as started'}
                </button>
              )}
              {isWorker && job.status === 'in_progress' && (
                <button onClick={() => doAction('complete')} disabled={actioning}
                  className="px-4 py-2 text-sm font-semibold bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-60 transition-all">
                  {actioning ? '…' : 'Mark as complete'}
                </button>
              )}
              {isCustomer && job.status === 'completed' && (
                <Link href={`/payments/pay?jobId=${job._id}`}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
                  Pay now →
                </Link>
              )}
              {['requested', 'accepted'].includes(job.status) && (
                <button onClick={() => doAction('cancel')} disabled={actioning}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-60 transition-all">
                  Cancel job
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Job timeline</h2>
          <div className="space-y-4">
            {job.timeline.map((entry, i) => (
              <div key={entry._id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${
                    i === job.timeline.length - 1 ? 'bg-accent' : 'bg-primary/40'
                  }`} />
                  {i < job.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-foreground">{STATUS_LABELS[entry.status] ?? entry.status}</p>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(entry.createdAt).toLocaleString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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