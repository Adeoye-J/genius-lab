'use client';

import { useState, useEffect } from 'react';

export function useWorker() {
  const [worker, setWorker]   = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/workers/me')
      .then((r) => r.json())
      .then((d) => { if (d.success) setWorker(d.data); else setError(d.error ?? 'Failed'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    fetch('/api/workers/me')
      .then((r) => r.json())
      .then((d) => { if (d.success) setWorker(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return { worker, loading, error, refresh };
}