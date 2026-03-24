'use client';

import { useState, useEffect, useCallback } from 'react';

export function useReviews(workerId: string, autoFetch = true) {
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(autoFetch && !!workerId);
  const [error, setError]     = useState('');

  const refresh = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    const res  = await fetch(`/api/reviews/${workerId}?limit=50`);
    const data = await res.json();
    if (data.success) setReviews(data.data.reviews);
    else setError(data.error ?? 'Failed to fetch reviews');
    setLoading(false);
  }, [workerId]);

  useEffect(() => { if (autoFetch) refresh(); }, [refresh, autoFetch]);

  async function submitReview(jobId: string, rating: number, comment?: string) {
    const res  = await fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, rating, comment }),
    });
    const data = await res.json();
    if (data.success) await refresh();
    return data;
  }

  return { reviews, loading, error, refresh, submitReview };
}