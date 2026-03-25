'use client';

import { formatNGNCompact } from '@/utils/formatCurrency';
import { useState, useEffect } from 'react';

interface Payment {
  _id: string;
  amount: number;
  status: string;
  paidAt?: string;
  paymentMethod?: string;
  jobId: { _id: string; title: string };
  transactionReference: string;
}

interface EarningsSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  totalPayments: number;
}

export default function WorkerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary]   = useState<EarningsSummary | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/payments/history').then((r) => r.json()),
      fetch('/api/workers/me').then((r) => r.json()),
    ]).then(([payData, workerData]) => {
      if (payData.success) {
        setPayments(payData.data.payments);
        setSummary({
          totalEarnings:   workerData.data?.earnings?.totalEarnings   ?? 0,
          monthlyEarnings: workerData.data?.earnings?.monthlyEarnings ?? 0,
          totalPayments:   payData.data.pagination.total,
        });
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground mb-1">Payments</h1>
        <p className="text-muted-foreground text-sm">Your verified earnings history</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            // { label: 'Total earned',   value: `₦${summary.totalEarnings.toLocaleString('en-NG')}`,   accent: true  },
            // { label: 'This month',     value: `₦${summary.monthlyEarnings.toLocaleString('en-NG')}`, accent: false },
            { label: 'Total earned',   value: formatNGNCompact(summary.totalEarnings),   accent: true  },
            { label: 'This month',     value: formatNGNCompact(summary.monthlyEarnings), accent: false },
            { label: 'Total payments', value: String(summary.totalPayments),                          accent: false },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.accent ? 'bg-accent/10 border-accent/20' : 'bg-card border-border'}`}>
              <p className="text-label mb-1">{s.label}</p>
              <p className={`text-2xl font-extrabold ${s.accent ? 'text-accent' : 'text-foreground'}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions */}
      {payments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold mb-2">No payments yet</p>
          <p className="text-sm">Verified payments will appear here after customers pay for your completed jobs</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction history</p>
          </div>
          <div className="divide-y divide-border">
            {payments.map((p) => (
              <div key={p._id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.jobId?.title ?? 'Job payment'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                    {p.paymentMethod && ` · via ${p.paymentMethod.replace('_', ' ')}`}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">Ref: {p.transactionReference}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-extrabold text-accent">+₦{p.amount.toLocaleString('en-NG')}</p>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}