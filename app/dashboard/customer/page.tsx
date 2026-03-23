'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json())
      .then((d) => { if (d.success) setName(d.data.user.name); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

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

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm mb-1">{greeting}</p>
        <h1 className="text-3xl font-extrabold text-foreground">{name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Find and hire skilled workers near you</p>
      </div>

      <div className="gradient-primary rounded-2xl p-8 mb-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Need something done?</h2>
        <p className="text-white/70 mb-6">Browse verified workers in your area. Every payment builds their financial record.</p>
        <Link
          href="/workers"
          className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-all active:scale-[0.98] text-sm"
        >
          Find workers near me
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: '/workers',                    label: 'Browse all workers', desc: 'Search by profession and location', icon: '🔍' },
          { href: '/dashboard/customer/history', label: 'My job history',     desc: 'View past jobs and payments',       icon: '📋' },
        ].map((a) => (
          <a key={a.href} href={a.href}
            className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-3">{a.icon}</div>
            <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{a.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}