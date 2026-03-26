'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  trustScore: number;
  completedJobs: number;
  verifiedPayments: number;
  averageRating: number;
  disputeCount: number;
  totalEarnings: number;
  monthlyEarnings: number;
  monthly: { month: string; earnings: number; jobs: number }[];
  ratingTrend: { month: string; rating: number; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

function EarningsChart({ data }: { data: { month: string; earnings: number }[] }) {
  const max = Math.max(...data.map((d) => d.earnings), 1);
  const W = 580, H = 140, BAR_W = Math.floor(W / data.length) - 8, PAD = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ height: 180 }}>
      {data.map((d, i) => {
        const barH = Math.max(4, Math.round((d.earnings / max) * H));
        const x    = i * (BAR_W + 8) + PAD;
        const y    = H - barH;
        return (
          <g key={d.month}>
            <rect
              x={x} y={y} width={BAR_W} height={barH}
              rx={4}
              fill={d.earnings > 0 ? '#3b82f6' : '#e5e7eb'}
              opacity={d.earnings > 0 ? 0.9 : 0.4}
            />
            <text
              x={x + BAR_W / 2} y={H + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {d.month}
            </text>
            {d.earnings > 0 && (
              <text
                x={x + BAR_W / 2} y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#3b82f6"
                fontWeight={600}
              >
                ₦{(d.earnings / 1000).toFixed(0)}k
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RatingChart({ data }: { data: { month: string; rating: number }[] }) {
  const hasData = data.some((d) => d.rating > 0);
  if (!hasData) return (
    <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
      No rating data yet
    </div>
  );

  const W = 580, H = 100, PAD_X = 20;
  const stepX = (W - PAD_X * 2) / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: d.rating > 0 ? H - ((d.rating / 5) * (H - 10)) : null,
    ...d,
  }));

  const pathD = points
    .filter((p) => p.y !== null)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ height: 140 }}>
      {[1, 2, 3, 4, 5].map((v) => {
        const y = H - ((v / 5) * (H - 10));
        return (
          <g key={v}>
            <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="#f3f4f6" strokeWidth={1} />
            <text x={4} y={y + 4} fontSize={9} fill="#9ca3af">{v}★</text>
          </g>
        );
      })}

      {pathD && (
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {points.map((p) =>
        p.y !== null ? (
          <g key={p.month}>
            <circle cx={p.x} cy={p.y!} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} />
            <text x={p.x} y={H + 16} textAnchor="middle" fontSize={10} fill="#6b7280">{p.month}</text>
          </g>
        ) : null
      )}
    </svg>
  );
}

function ScoreBreakdown({ data }: { data: AnalyticsData }) {
  const components = [
    {
      label:  'Completed jobs',
      weight: '40%',
      value:  Math.min(data.completedJobs, 50),
      max:    50,
      pts:    Math.round(Math.min((data.completedJobs / 50) * 40, 40)),
      color:  'bg-blue-500',
    },
    {
      label:  'Verified payments',
      weight: '30%',
      value:  Math.min(data.verifiedPayments, 50),
      max:    50,
      pts:    Math.round(Math.min((data.verifiedPayments / 50) * 30, 30)),
      color:  'bg-emerald-500',
    },
    {
      label:  'Average rating',
      weight: '20%',
      value:  data.averageRating,
      max:    5,
      pts:    Math.round((data.averageRating / 5) * 20),
      color:  'bg-amber-400',
    },
  ];

  return (
    <div className="space-y-5">
      {components.map((c) => (
        <div key={c.label}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{c.label} <span className="text-xs text-gray-500 dark:text-gray-300">({c.weight})</span></span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-300 tabular-nums">
              {c.value}{c.label === 'Average rating' ? '/5.0' : `/${c.max}`}
              <span className="text-xs text-gray-500 dark:text-gray-300 ml-2">→ {c.pts} pts</span>
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${c.color}`}
              style={{ width: `${Math.round((c.value / c.max) * 100)}%` }}
            />
          </div>
        </div>
      ))}

      {data.disputeCount > 0 && (
        <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200 text-red-600">
          <span>Disputes (penalty)</span>
          <span className="font-semibold">−{Math.min(data.disputeCount * 5, 10)} pts</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-sm font-semibold text-gray-900">Trust score</span>
        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.trustScore}<span className="text-sm text-gray-500 dark:text-gray-300 font-normal ml-1">/100</span></span>
      </div>
    </div>
  );
}

export default function WorkerAnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/analytics/worker')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error ?? 'Failed to load analytics');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-center py-16">
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading your analytics...</p>
          </div>
        </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-300">{error || 'No data available'}</p>
      </div>
    );
  }

  const milestoneMsg =
    data.trustScore < 30 ? `Complete ${Math.max(0, 5 - data.completedJobs)} more job${data.completedJobs < 4 ? 's' : ''} to build your early reputation` :
    data.trustScore < 60 ? `${60 - data.trustScore} more points to reach Growing Credibility` :
    data.trustScore < 80 ? `${80 - data.trustScore} more points to reach Trusted Worker status` :
    'You are a Top Rated worker — keep delivering excellent work';

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="mb-8">
         <p className="text-foreground font-semibold text-xl mb-1 capitalize">Analytics</p>
          <p className="text-sm text-foreground/60">Your performance and financial credibility at a glance</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trust Score Card */}
        <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-2">Trust score</p>
              <p className="text-3xl font-bold text-blue-600">{data.trustScore}</p>
              <p className="text-xs text-blue-600 mt-1">/100</p>
            </div>
            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Earned Card */}
        <div className="bg-linear-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900 mb-2">Total earned</p>
              <p className="text-3xl font-bold text-emerald-600">₦{(data.totalEarnings / 1000).toFixed(0)}k</p>
              <p className="text-xs text-emerald-600 mt-1">Verified</p>
            </div>
            <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Jobs Completed Card */}
        <div className="bg-linear-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900 mb-2">Jobs completed</p>
              <p className="text-3xl font-bold text-purple-600">{data.completedJobs}</p>
              <p className="text-xs text-purple-600 mt-1">Verified</p>
            </div>
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* Avg Rating Card */}
        <div className="bg-linear-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-amber-900 mb-2">Avg rating</p>
              <p className="text-3xl font-bold text-amber-600">{data.averageRating > 0 ? data.averageRating.toFixed(1) : '—'}</p>
              <p className="text-xs text-amber-600 mt-1">/5.0 stars</p>
            </div>
            <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Monthly earnings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Last 6 months performance</p>
          </div>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Last 6 months</span>
        </div>
        {data.monthly.some((m) => m.earnings > 0) ? (
          <EarningsChart data={data.monthly} />
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-300 text-sm">
            No earnings data yet — complete your first paid job
          </div>
        )}
      </div>

      {/* Trust Score Breakdown */}
      <div className="border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Trust score breakdown</h2>
        <ScoreBreakdown data={data} />
      </div>

      {/* Rating Trend */}
      <div className="border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Rating trend</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">How your ratings have evolved</p>
          </div>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Last 6 months</span>
        </div>
        <RatingChart data={data.ratingTrend} />
      </div>

      {/* Milestone Card */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold mb-2">Next milestone</p>
            <p className="text-sm text-blue-100">{milestoneMsg}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
        <Link href="/dashboard/worker/jobs"
          className="flex items-center justify-center h-11 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
          View jobs
        </Link>
        <Link href="/dashboard/worker/payments"
          className="flex items-center justify-center h-11 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          View payments
        </Link>
        <Link href="/dashboard/worker/reviews"
          className="flex items-center justify-center h-11 border border-gray-300 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          View reviews
        </Link>
      </div>
    </div>
  );
}
