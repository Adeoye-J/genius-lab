'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WORKER_PROFESSIONS, NIGERIAN_STATES } from '@/config/constants';

interface Worker {
  _id: string;
  profession: string;
  skills: string[];
  bio: string;
  location: { city: string; state: string };
  trustScore: number;
  averageRating: number;
  totalJobsCompleted: number;
  isAvailable: boolean;
  userId: { name: string; profileImage?: string };
}

function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-accent/15 text-accent border-accent/30' :
    score >= 50 ? 'bg-primary/10 text-primary border-primary/30' :
                  'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {score}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-muted-foreground/30'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function WorkerCard({ worker }: { worker: Worker }) {
  const initials = worker.userId.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-sm">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{worker.userId.name}</p>
            {worker.isAvailable && (
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Available</span>
            )}
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">{worker.profession}</p>
          <p className="text-muted-foreground text-xs">{worker.location.city}, {worker.location.state}</p>
        </div>
        <TrustBadge score={worker.trustScore} />
      </div>

      {/* Bio */}
      {worker.bio && (
        <p className="text-sm text-muted-foreground line-clamp-2">{worker.bio}</p>
      )}

      {/* Skills */}
      {worker.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {worker.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
              {skill}
            </span>
          ))}
          {worker.skills.length > 4 && (
            <span className="text-xs text-muted-foreground">+{worker.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Stats + CTA */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          {worker.averageRating > 0 ? (
            <div className="flex items-center gap-1">
              <Stars rating={worker.averageRating} />
              <span className="text-xs text-muted-foreground">{worker.averageRating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No reviews yet</span>
          )}
          <span className="text-xs text-muted-foreground">{worker.totalJobsCompleted} jobs done</span>
        </div>
        <Link
          href={`/workers/${worker._id}`}
          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View profile →
        </Link>
      </div>
    </div>
  );
}

export default function WorkersPage() {
  const [workers, setWorkers]       = useState<Worker[]>([]);
  const [loading, setLoading]       = useState(true);
  const [profession, setProfession] = useState('');
  const [state, setState]           = useState('');
  const [city, setCity]             = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (profession) params.set('profession', profession);
    if (state)      params.set('state', state);
    if (city)       params.set('city', city);

    const res  = await fetch(`/api/workers?${params}`);
    const data = await res.json();
    if (data.success) {
      setWorkers(data.data.workers);
      setTotalPages(data.data.pagination.pages);
    }
    setLoading(false);
  }, [profession, state, city, page]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  function handleSearch() { setPage(1); fetchWorkers(); }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-foreground">StreetCred</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/login"    className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/register" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">Join free</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Find skilled workers</h1>
          <p className="text-muted-foreground">Every worker on StreetCred has a verified transaction history and trust score.</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All professions</option>
            {WORKER_PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All states</option>
            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (e.g. Ikeja)"
            className="h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            onClick={handleSearch}
            className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Search
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No workers found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workers.map((w) => <WorkerCard key={w._id} worker={w} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>
            <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}