'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePayments(autoFetch = true) {
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(autoFetch);
  const [error, setError]       = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const refresh = useCallback(async (page = 1) => {
    setLoading(true);
    const res  = await fetch(`/api/payments/history?page=${page}`);
    const data = await res.json();
    if (data.success) {
      setPayments(data.data.payments);
      setPagination(data.data.pagination);
    } else {
      setError(data.error ?? 'Failed to fetch payments');
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (autoFetch) refresh(1); }, [refresh, autoFetch]);

  async function initializePayment(jobId: string): Promise<string | null> {
    const res  = await fetch('/api/payments/initialize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    return data.success ? data.data.paymentUrl : null;
  }

  async function verifyPayment(transactionRef: string) {
    const res  = await fetch('/api/payments/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionRef }),
    });
    return res.json();
  }

  return { payments, loading, error, pagination, refresh, initializePayment, verifyPayment };
}