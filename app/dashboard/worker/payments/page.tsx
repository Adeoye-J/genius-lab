'use client';

import { formatNGNCompact } from '@/utils/formatCurrency';
import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, CreditCard } from 'lucide-react';

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
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          {/* <div className="w-8 h-8 border-4 border-t-foreground rounded-full animate-spin border-primary mx-auto" /> */}
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading your payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
         <p className="text-foreground font-semibold text-xl mb-1 capitalize">Payments</p>
          <p className="text-sm text-foreground/60">Track your verified earnings and transaction history</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {/* Total Earned */}
          <div className="bg-linear-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Earned</span>
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{formatNGNCompact(summary.totalEarnings)}</p>
            <p className="text-xs text-blue-600/70 mt-2">All-time earnings</p>
          </div>

          {/* This Month */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">This Month</span>
              <Calendar size={18} className="text-foreground/40" />
            </div>
            <p className="text-3xl font-bold text-foreground">{formatNGNCompact(summary.monthlyEarnings)}</p>
            <p className="text-xs text-foreground/50 mt-2">Current month earnings</p>
          </div>

          {/* Total Payments */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">Total Payments</span>
              <CreditCard size={18} className="text-foreground/40" />
            </div>
            <p className="text-3xl font-bold text-foreground">{summary.totalPayments}</p>
            <p className="text-xs text-foreground/50 mt-2">Verified transactions</p>
          </div>
        </div>
      )}

      {/* Transactions */}
      {payments.length === 0 ? (
        <div className="bg-surface-muted border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard size={24} className="text-foreground/30" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground mb-2">No payments yet</p>
          <p className="text-sm text-foreground/60">Verified payments will appear here after customers pay for your completed jobs</p>
        </div>
      ) : (
        <div className="bg-surface-muted border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 bg-surface-muted border-b border-gray-200">
            <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Transaction History</p>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {payments.map((p) => (
              <div key={p._id} className="px-6 py-4 flex items-start justify-between gap-6 hover:bg-surface-muted/20 transition-colors">
                {/* Left: Job Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{p.jobId?.title ?? 'Job payment'}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {p.paidAt && (
                      <p className="text-xs text-foreground/50 flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(p.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {p.paymentMethod && (
                      <p className="text-xs text-foreground/50">via {p.paymentMethod.replace('_', ' ')}</p>
                    )}
                  </div>
                  {p.transactionReference && (
                    <p className="text-xs text-foreground/40 font-mono mt-1 truncate">Ref: {p.transactionReference}</p>
                  )}
                </div>

                {/* Right: Amount & Status */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-green-600">+₦{p.amount.toLocaleString('en-NG')}</p>
                  <span className="inline-block text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium mt-2">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
