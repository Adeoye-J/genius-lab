'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WORKER_PROFESSIONS, NIGERIAN_STATES } from '@/config/constants';
import { Map, Verified } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';


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
  const initials = worker.userId.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-[320px] bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      
      {/* Top Section */}
      <div className="relative bg-linear-to-b from-accent/80 to-accent/90 h-48 flex items-center justify-center">
        
        {/* Profile Image / Initials */}
        {worker.userId.profileImage ? (
          <img
            src={worker.userId.profileImage}
            alt={worker.userId.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-white/20"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
        )}

        {/* Availability Badge */}
        <div
          className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
            worker.isAvailable
              ? 'bg-white text-primary'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          <Verified size={16} />
          {worker.isAvailable ? 'Available' : 'Unavailable'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        
        {/* Name + Rating */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 capitalize">
              {worker.userId.name}
            </h3>
            <p className="text-sm text-gray-500">
              {worker.profession}
            </p>
            <p className="text-xs text-gray-400">
              {worker.location.city}, {worker.location.state}
            </p>
          </div>

          {/* Rating */}
          {worker.averageRating > 0 && (
            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm font-medium">
              <Stars rating={worker.averageRating} />
              <span>{worker.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {worker.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worker.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}
            {worker.skills.length > 4 && (
              <span className="text-xs text-gray-400">
                +{worker.skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Trust Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-500">
              TRUST SCORE
            </span>
            
            {/* Your TrustBadge */}
            <TrustBadge score={worker.trustScore} />
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-accent rounded-full transition-all duration-500"
              style={{ width: `${worker.trustScore}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            {worker.totalJobsCompleted} jobs completed
          </span>

          <Link
            href={`/workers/${worker._id}`}
            className="bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-blue-800 transition"
          >
            View Profile
          </Link>
        </div>
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

  const {user} = useAuth()

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
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <Map />
          </div>
          <span className="font-bold text-foreground">StreetCred</span>
        </Link>
        {
          user ? (
            <div className="">
              <Link href="/dashboard/customer" className="text-sm font-semibold text-white transition-colors bg-primary hover:bg-primary/80 py-3 px-4 rounded-lg duration-500">Go to Dashboard</Link>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <Link href="/login"    className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/register" className="text-sm font-semibold text-white transition-colors bg-primary hover:bg-primary/80 py-3 px-4 rounded-lg duration-500">Join free</Link>
            </div>
          )
        }
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
          <div className="flex items-center justify-center text-center py-16">
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading available workers...</p>
          </div>
        </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No workers found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-sm:place-items-center">
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