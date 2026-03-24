'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseJobsOptions {
  status?: string;
  limit?: number;
  autoFetch?: boolean;
}

export function useJobs(options: UseJobsOptions = {}) {
  const { status, limit = 20, autoFetch = true } = options;

  const [jobs, setJobs]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError]     = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 0 });

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);

    const res  = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    if (data.success) {
      setJobs(data.data.jobs);
      setPagination(data.data.pagination);
    } else {
      setError(data.error ?? 'Failed to fetch jobs');
    }
    setLoading(false);
  }, [status, limit]);

  useEffect(() => { if (autoFetch) fetch_(1); }, [fetch_, autoFetch]);

  async function doAction(jobId: string, action: string) {
    const res = await fetch(`/api/jobs/${jobId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) await fetch_(pagination.page);
    return res.ok;
  }

  return { jobs, loading, error, pagination, refresh: fetch_, doAction };
}