'use client';

import { useWorker } from '@/hooks/useWorker';
import { formatNGNCompact } from '@/utils/formatCurrency';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface WorkerStats {
  name: string;
  profession: string;
  trustScore: number;
  totalJobsCompleted: number;
  averageRating: number;
  totalEarnings: number;
  pendingJobs: number;
  activeJobs: number;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border ${accent ? 'bg-accent/10 border-accent/20' : 'bg-card border-border'}`}>
      <p className="text-label mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${accent ? 'text-accent' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function TrustScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="10"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground mt-2">Trust Score</p>
      <p className="text-xs text-muted-foreground">
        {score < 30 ? 'Building reputation' : score < 60 ? 'Growing credibility' : score < 80 ? 'Trusted worker' : 'Top rated'}
      </p>
    </div>
  );
}

export default function WorkerDashboardPage() {
  const [stats, setStats]     = useState<WorkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const {worker} = useWorker()

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/workers/me').then((r) => r.json()).catch(() => ({ success: false })),
    ])
      .then(([meData, workerData]) => {
        if (!meData.success) return;
        const user   = meData.data.user;
        const worker = workerData.success ? workerData.data : null;
        setStats({
          name:               user.name,
          profession:         worker?.profession ?? '—',
          trustScore:         worker?.trustScore ?? 0,
          totalJobsCompleted: worker?.totalJobsCompleted ?? 0,
          averageRating:      worker?.averageRating ?? 0,
          totalEarnings:      worker?.earnings?.totalEarnings ?? 0,
          pendingJobs:        worker?.pendingJobs ?? 0,
          activeJobs:         worker?.activeJobs ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="mb-8">
        <p className="text-foreground font-semibold text-xl mb-1">{greeting} <span className="capitalize text-primary font-bold">{stats?.name?.split(' ')[0] ?? 'Worker'} 👋</span></p>
        {/* <h1 className="text-3xl font-extrabold text-foreground">{stats?.name?.split(' ')[0] ?? 'Worker'} 👋</h1> */}
        <p className="text-muted-foreground mt-1">Here's your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 flex items-center justify-center">
          <TrustScoreRing score={stats?.trustScore ?? 0} />
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total Earnings"    value={`₦${(stats?.totalEarnings ?? 0).toLocaleString('en-NG')}`} sub="Verified payments" />
          {/* <StatCard label="Total Earnings"    value={formatNGNCompact(stats?.totalEarnings ?? 0)} sub="Verified payments" /> */}
          <StatCard label="Jobs Completed"    value={String(stats?.totalJobsCompleted ?? 0)} sub="Verified by customers" />
          <StatCard label="Average Rating"    value={stats?.averageRating ? stats.averageRating.toFixed(1) : '—'} sub="★ out of 5.0" accent />
          <StatCard label="Pending Requests"  value={String(stats?.pendingJobs ?? 0)} sub="Awaiting your response" />
          <StatCard label="Active Jobs"       value={String(stats?.activeJobs ?? 0)} sub="Currently in progress" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="">
            <h2 className='font-bold text-primary'>Active Jobs</h2>
            <p className='text-sm text-muted-foreground'>Manage your ongoing tasks</p>
          </div>
          <Link href={""} className='flex items-center gap-2 text-sm'>
            View All Jobs
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="">
          
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/worker/jobs',     label: 'View job requests', desc: 'Accept or decline incoming jobs', icon: '💼' },
          { href: '/dashboard/worker/payments', label: 'Payment history',   desc: 'See all verified transactions',  icon: '💳' },
          { href: '/dashboard/worker/reviews',  label: 'Customer reviews',  desc: 'Read what customers are saying', icon: '⭐' },
        ].map((a) => (
          <a key={a.href} href={a.href} className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all">
            <div className="text-2xl mb-3">{a.icon}</div>
            <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{a.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}