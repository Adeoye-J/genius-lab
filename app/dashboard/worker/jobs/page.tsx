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

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  requested: { label: 'Pending', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  accepted: { label: 'Accepted', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  in_progress: { label: 'In Progress', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  completed: { label: 'Completed', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  paid: { label: 'Paid', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
};

export default function WorkerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = tab === 'active' ? 'requested,accepted,in_progress' : 'completed,paid,cancelled';
      const res = await fetch(`/api/jobs?status=${statuses}&limit=50`);
      const data = await res.json();
      if (data.success) setJobs(data.data.jobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleAction(jobId: string, action: string) {
    setActioning(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) await fetchJobs();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActioning(null);
    }
  }

  const cfg = STATUS_CONFIG[jobs[0]?.status] ?? { label: 'Unknown', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' };

  return (
    <div className="max-w-4xl w-full min-w-0">
      {/* Header */}
      <div className="mb-8">
         <p className="text-foreground font-semibold text-xl mb-1 capitalize">Jobs</p>
          <p className="text-sm text-foreground/60">Manage your job requests and active work</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-fit">
        {[
          { id: 'active' as const, label: 'Active jobs' },
          { id: 'history' as const, label: 'History' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center text-center py-16">
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading your jobs...</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            {tab === 'active' ? 'No active jobs' : 'No job history yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {tab === 'active' ? 'New requests will appear here' : 'Completed and cancelled jobs show up here'}
          </p>
        </div>
      ) : (
        /* Jobs Grid */
        <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {jobs.map((job) => {
            const statusCfg = STATUS_CONFIG[job.status] ?? { label: 'Unknown', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-200' };
            const isActioning = actioning === job._id;

            return (
              <div
                key={job._id}
                className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {job.customerId.name} · {job.location.city && `${job.location.city}, `}{job.location.state}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap ${statusCfg.bgColor} ${statusCfg.textColor} ${statusCfg.borderColor}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                )}

                {/* Price & Date */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-lg text-primary">₦{job.price.toLocaleString('en-NG')}</span>
                  {job.scheduledDate && (
                    <span className="text-muted-foreground">
                      {new Date(job.scheduledDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <Link
                    href={`/jobs/${job._id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View details
                  </Link>

                  {job.status === 'requested' && (
                    <>
                      <button
                        onClick={() => handleAction(job._id, 'accept')}
                        disabled={isActioning}
                        className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-accent-foreground cursor-pointer hover:bg-accent/90 disabled:opacity-60 transition-all"
                      >
                        {isActioning ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(job._id, 'cancel')}
                        disabled={isActioning}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border cursor-pointer text-muted-foreground hover:bg-muted disabled:opacity-60 transition-all"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {job.status === 'accepted' && (
                    <button
                      onClick={() => handleAction(job._id, 'start')}
                      disabled={isActioning}
                      className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary cursor-pointer text-white hover:bg-primary/90 disabled:opacity-60 transition-all"
                    >
                      {isActioning ? '...' : 'Mark Started'}
                    </button>
                  )}

                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => handleAction(job._id, 'complete')}
                      disabled={isActioning}
                      className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent cursor-pointer text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-all"
                    >
                      {isActioning ? '...' : 'Mark Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
