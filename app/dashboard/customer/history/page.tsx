'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  workerId: { profession: string; trustScore: number };
  location: { city: string; state: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  requested:   { label: 'Pending',     color: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted:    { label: 'Accepted',    color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed:   { label: 'Awaiting payment', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  paid:        { label: 'Paid',        color: 'bg-accent/10 text-accent border-accent/20' },
  cancelled:   { label: 'Cancelled',   color: 'bg-muted text-muted-foreground border-border' },
};

export default function CustomerHistoryPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/jobs?limit=50');
    const data = await res.json();
    if (data.success) setJobs(data.data.jobs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground mb-1">Job history</h1>
        <p className="text-muted-foreground text-sm">All jobs you have requested here</p>
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
          <p className="text-lg font-semibold mb-2">No jobs yet</p>
          <p className="text-sm mb-6">Hire your first worker to get started</p>
          <Link href="/workers" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
            Browse workers
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status] ?? { label: job.status, color: 'bg-muted text-muted-foreground border-border' };
            return (
              <Link key={job._id} href={`/jobs/${job._id}`}
                className="block bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.workerId.profession} ·{' '}
                      {new Date(job.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-foreground">₦{job.price.toLocaleString('en-NG')}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                {job.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-orange-600 font-medium">⚠ Payment required — click to pay worker</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}