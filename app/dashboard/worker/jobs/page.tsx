'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  scheduledDate?: string;
  createdAt: string;
  customerId: { name: string };
  location: { city: string; state: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  requested:   { label: 'Pending',      color: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted:    { label: 'Accepted',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'In Progress',  color: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed:   { label: 'Completed',    color: 'bg-green-100 text-green-800 border-green-200' },
  paid:        { label: 'Paid',         color: 'bg-accent/10 text-accent border-accent/20' },
  cancelled:   { label: 'Cancelled',    color: 'bg-muted text-muted-foreground border-border' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function JobCard({ job, onAction, actioning }: {
  job: Job;
  onAction: (jobId: string, action: string) => void;
  actioning: string | null;
}) {
  const isActioning = actioning === job._id;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            From {job.customerId.name} ·{' '}
            {job.location.city && `${job.location.city}, `}{job.location.state}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
      )}

      {/* Price + date */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-bold text-foreground text-lg">₦{job.price.toLocaleString('en-NG')}</span>
        {job.scheduledDate && (
          <span className="text-muted-foreground">
            📅 {new Date(job.scheduledDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <Link href={`/jobs/${job._id}`} className="text-xs text-primary hover:underline font-medium">
          View details
        </Link>

        {job.status === 'requested' && (
          <>
            <button
              onClick={() => onAction(job._id, 'accept')}
              disabled={isActioning}
              className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-all"
            >
              {isActioning ? '…' : 'Accept'}
            </button>
            <button
              onClick={() => onAction(job._id, 'cancel')}
              disabled={isActioning}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-60 transition-all"
            >
              Decline
            </button>
          </>
        )}

        {job.status === 'accepted' && (
          <button
            onClick={() => onAction(job._id, 'start')}
            disabled={isActioning}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {isActioning ? '…' : 'Mark Started'}
          </button>
        )}

        {job.status === 'in_progress' && (
          <button
            onClick={() => onAction(job._id, 'complete')}
            disabled={isActioning}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-all"
          >
            {isActioning ? '…' : 'Mark Complete'}
          </button>
        )}
      </div>
    </div>
  );
}

type Tab = 'active' | 'history';

export default function WorkerJobsPage() {
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>('active');
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const statuses = tab === 'active'
      ? 'requested,accepted,in_progress'
      : 'completed,paid,cancelled';
    const res  = await fetch(`/api/jobs?status=${statuses}&limit=50`);
    const data = await res.json();
    if (data.success) setJobs(data.data.jobs);
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  async function handleAction(jobId: string, action: string) {
    setActioning(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) await fetchJobs();
    } catch { /* handled silently — refetch shows current state */ }
    finally { setActioning(null); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'active',  label: 'Active jobs' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground mb-1">Jobs</h1>
        <p className="text-muted-foreground text-sm">Manage your job requests and active work</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold mb-2">{tab === 'active' ? 'No active jobs' : 'No job history yet'}</p>
          <p className="text-sm">{tab === 'active' ? 'New requests will appear here' : 'Completed and cancelled jobs show up here'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} onAction={handleAction} actioning={actioning} />
          ))}
        </div>
      )}
    </div>
  );
}