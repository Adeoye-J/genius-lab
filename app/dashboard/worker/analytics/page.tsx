'use client';

// Uses /api/analytics/worker for all data.
// Charts are rendered as pure SVG — no chart library dependency.

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

// ── Earnings bar chart (SVG) ──────────────────────────────────────
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
              fill={d.earnings > 0 ? 'hsl(var(--accent))' : 'hsl(var(--muted))'}
              opacity={d.earnings > 0 ? 0.85 : 0.4}
            />
            <text
              x={x + BAR_W / 2} y={H + 16}
              textAnchor="middle"
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
            >
              {d.month}
            </text>
            {d.earnings > 0 && (
              <text
                x={x + BAR_W / 2} y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="hsl(var(--accent))"
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

// ── Rating trend (SVG line chart) ────────────────────────────────
function RatingChart({ data }: { data: { month: string; rating: number }[] }) {
  const hasData = data.some((d) => d.rating > 0);
  if (!hasData) return (
    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
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
      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map((v) => {
        const y = H - ((v / 5) * (H - 10));
        return (
          <g key={v}>
            <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="3 3" />
            <text x={4} y={y + 4} fontSize={9} fill="hsl(var(--muted-foreground))">{v}★</text>
          </g>
        );
      })}

      {/* Line */}
      {pathD && (
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots + labels */}
      {points.map((p) =>
        p.y !== null ? (
          <g key={p.month}>
            <circle cx={p.x} cy={p.y!} r={4} fill="hsl(var(--primary))" />
            <text x={p.x} y={H + 16} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{p.month}</text>
          </g>
        ) : null
      )}
    </svg>
  );
}

// ── Trust score breakdown bar ────────────────────────────────────
function ScoreBreakdown({ data }: { data: AnalyticsData }) {
  const components = [
    {
      label:  'Completed jobs',
      weight: '40%',
      value:  Math.min(data.completedJobs, 50),
      max:    50,
      pts:    Math.round(Math.min((data.completedJobs / 50) * 40, 40)),
      color:  'bg-primary',
    },
    {
      label:  'Verified payments',
      weight: '30%',
      value:  Math.min(data.verifiedPayments, 50),
      max:    50,
      pts:    Math.round(Math.min((data.verifiedPayments / 50) * 30, 30)),
      color:  'bg-accent',
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
    <div className="space-y-4">
      {components.map((c) => (
        <div key={c.label}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">{c.label} <span className="text-xs">({c.weight})</span></span>
            <span className="font-semibold text-foreground tabular-nums">
              {c.value}{c.label === 'Average rating' ? '/5.0' : `/${c.max}`}
              <span className="text-xs text-muted-foreground ml-2">→ {c.pts} pts</span>
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${c.color}`}
              style={{ width: `${Math.round((c.value / c.max) * 100)}%` }}
            />
          </div>
        </div>
      ))}

      {data.disputeCount > 0 && (
        <div className="flex items-center justify-between text-sm pt-1 border-t border-border text-destructive">
          <span>Disputes (penalty)</span>
          <span className="font-semibold">−{Math.min(data.disputeCount * 5, 10)} pts</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm font-medium text-foreground">Trust score</span>
        <span className="text-2xl font-extrabold text-accent">{data.trustScore}<span className="text-sm text-muted-foreground font-normal">/100</span></span>
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
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{error || 'No data available'}</p>
      </div>
    );
  }

  const h = new Date().getHours();
  const milestoneMsg =
    data.trustScore < 30 ? `Complete ${Math.max(0, 5 - data.completedJobs)} more job${data.completedJobs < 4 ? 's' : ''} to build your early reputation` :
    data.trustScore < 60 ? `${60 - data.trustScore} more points to reach Growing Credibility` :
    data.trustScore < 80 ? `${80 - data.trustScore} more points to reach Trusted Worker status` :
    'You are a Top Rated worker — keep delivering excellent work';

  return (
    <div className="max-w-4xl animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground mb-1">Analytics</h1>
        <p className="text-muted-foreground text-sm">Your performance and financial credibility at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Trust score',    value: data.trustScore,    suffix: '/100', accent: true  },
          { label: 'Total earned',   value: `₦${data.totalEarnings.toLocaleString('en-NG')}`,   suffix: '', accent: false },
          { label: 'Jobs completed', value: data.completedJobs,    suffix: '',     accent: false },
          { label: 'Avg rating',     value: data.averageRating > 0 ? data.averageRating.toFixed(1) : '—', suffix: '', accent: false },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.accent ? 'bg-accent/10 border-accent/20' : 'bg-card border-border'}`}>
            <p className="text-label mb-1">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.accent ? 'text-accent' : 'text-foreground'}`}>
              {s.value}<span className="text-sm font-normal text-muted-foreground">{s.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Earnings chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Monthly earnings</h2>
          <span className="text-xs text-muted-foreground">Last 6 months</span>
        </div>
        {data.monthly.some((m) => m.earnings > 0) ? (
          <EarningsChart data={data.monthly} />
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No earnings data yet — complete your first paid job
          </div>
        )}
      </div>

      {/* Trust score breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5">Trust score breakdown</h2>
        <ScoreBreakdown data={data} />
      </div>

      {/* Rating trend */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Rating trend</h2>
          <span className="text-xs text-muted-foreground">Last 6 months</span>
        </div>
        <RatingChart data={data.ratingTrend} />
      </div>

      {/* Milestone card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Next milestone</p>
          <p className="text-sm text-muted-foreground">{milestoneMsg}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link href="/dashboard/worker/jobs"
          className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center justify-center hover:bg-primary/90 transition-all">
          View jobs
        </Link>
        <Link href="/dashboard/worker/payments"
          className="flex-1 h-10 border border-border bg-card text-foreground rounded-lg text-sm font-semibold flex items-center justify-center hover:bg-muted transition-all">
          View payments
        </Link>
        <Link href="/dashboard/worker/reviews"
          className="flex-1 h-10 border border-border bg-card text-foreground rounded-lg text-sm font-semibold flex items-center justify-center hover:bg-muted transition-all">
          View reviews
        </Link>
      </div>
    </div>
  );
}