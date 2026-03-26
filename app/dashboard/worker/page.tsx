'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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

export default function WorkerDashboardPage() {
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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


  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center text-center py-16">
        <div className="flex flex-col gap-3 items-center justify-center h-64">
          <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-foreground/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="font-semibold text-foreground">Unable to load dashboard</h2>
          <p className="text-sm text-foreground/60">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = stats.name?.split(' ')[0] || 'Worker';

  const trustLabel = stats.trustScore < 30 ? 'Building reputation'
    : stats.trustScore < 60 ? 'Growing credibility'
    : stats.trustScore < 80 ? 'Trusted worker'
    : 'Top rated';

  const formattedEarnings = stats.totalEarnings >= 1_000_000
    ? `₦${(stats.totalEarnings / 1_000_000).toFixed(1)}M`
    : stats.totalEarnings >= 1_000
    ? `₦${(stats.totalEarnings / 1_000).toFixed(1)}K`
    : `₦${stats.totalEarnings.toLocaleString('en-NG')}`;

  const trustCircumference = 2 * Math.PI * 52;
  const trustOffset = trustCircumference - (stats.trustScore / 100) * trustCircumference;

  return (
    <div className="max-w-6xl">
      {/* Header */}
       <div className="mb-8">
         <p className="text-foreground font-semibold text-xl mb-1 capitalize">{greeting}, <span className="capitalize text-primary font-bold">{stats?.name?.split(' ')[0] ?? 'Worker'} 👋</span></p>
          <p className="text-sm text-foreground/60">Here&apos;s an overview of your activity and upcoming work</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Trust Score */}
        <div className="bg-surface-muted border border-gray-200 rounded-lg p-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="#2563eb" strokeWidth="10"
                  strokeDasharray={trustCircumference}
                  strokeDashoffset={trustOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{stats.trustScore}</span>
                <span className="text-xs text-foreground/60">/ 100</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">Trust Score</p>
            <p className="text-xs text-foreground/60 text-center mt-1">{trustLabel}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Total Earnings */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-foreground">{formattedEarnings}</p>
            <p className="text-xs text-foreground/60 mt-1">Verified payments</p>
          </div>

          {/* Jobs Completed */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1">Jobs Completed</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalJobsCompleted}</p>
            <p className="text-xs text-foreground/60 mt-1">Verified by customers</p>
          </div>

          {/* Average Rating */}
          <div className="bg-surface-muted border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-medium text-orange-300 uppercase tracking-wide mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-orange-300">{stats.averageRating ? stats.averageRating.toFixed(1) : '—'}</p>
            <p className="text-xs text-foreground/60 mt-1">★ out of 5.0</p>
          </div>

          {/* Pending Requests */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1">Pending Requests</p>
            <p className="text-2xl font-bold text-foreground">{stats.pendingJobs}</p>
            <p className="text-xs text-foreground/60 mt-1">Awaiting your response</p>
          </div>

          {/* Active Jobs */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1">Active Jobs</p>
            <p className="text-2xl font-bold text-foreground">{stats.activeJobs}</p>
            <p className="text-xs text-foreground/60 mt-1">Currently in progress</p>
          </div>

          {/* Profession */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1">Profession</p>
            <p className="text-2xl font-bold text-accent truncate">{stats.profession || '—'}</p>
            <p className="text-xs text-foreground/60 mt-1">Your expertise</p>
          </div>
        </div>
      </div>

      {/* Active Jobs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-foreground text-lg">Active Jobs</h2>
            <p className="text-sm text-foreground/60">Manage your ongoing tasks</p>
          </div>
          <Link
            href="/dashboard/worker/jobs"
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Jobs
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="bg-surface-muted border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-foreground/60">No active jobs at the moment</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/worker/jobs"
          className="group bg-surface-muted border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">💼</div>
          <p className="font-medium text-foreground text-sm group-hover:text-blue-600 transition-colors">
            View job requests
          </p>
          <p className="text-xs text-foreground/60 mt-1">Accept or decline incoming jobs</p>
        </Link>

        <Link
          href="/dashboard/worker/payments"
          className="group bg-surface-muted border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">💳</div>
          <p className="font-medium text-foreground text-sm group-hover:text-blue-600 transition-colors">
            Payment history
          </p>
          <p className="text-xs text-foreground/60 mt-1">See all verified transactions</p>
        </Link>

        <Link
          href="/dashboard/worker/reviews"
          className="group bg-surface-muted border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-3">⭐</div>
          <p className="font-medium text-foreground text-sm group-hover:text-blue-600 transition-colors">
            Customer reviews
          </p>
          <p className="text-xs text-foreground/60 mt-1">Read what customers are saying</p>
        </Link>
      </div>
    </div>
  );
}
