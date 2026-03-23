'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface WorkerProfile {
  _id: string;
  profession: string;
  skills: string[];
  bio: string;
  location: { city: string; state: string };
  trustScore: number;
  averageRating: number;
  totalJobsCompleted: number;
  yearsOfExperience: number;
  isAvailable: boolean;
  userId: { name: string; profileImage?: string; createdAt: string };
  reviews: Array<{ _id: string; rating: number; comment: string; customerId: { name: string }; createdAt: string }>;
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`${cls} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-muted-foreground/30'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function WorkerProfilePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const router       = useRouter();

  const [worker, setWorker]   = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/workers/${workerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setWorker(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [workerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (notFound || !worker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground mb-2">Worker not found</p>
          <Link href="/workers" className="text-primary hover:underline text-sm">← Back to directory</Link>
        </div>
      </div>
    );
  }

  const initials = worker.userId.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = new Date(worker.userId.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <Link href="/workers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to workers
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-bold text-foreground">StreetCred</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — profile card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-2xl">{initials}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">{worker.userId.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{worker.profession}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{worker.location.city}, {worker.location.state}</p>

            {worker.isAvailable && (
              <span className="inline-block mt-3 text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                ✓ Available for work
              </span>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-extrabold text-foreground">{worker.trustScore}</p>
                <p className="text-xs text-muted-foreground">Trust score</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">{worker.totalJobsCompleted}</p>
                <p className="text-xs text-muted-foreground">Jobs done</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground">
                  {worker.averageRating > 0 ? worker.averageRating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/dashboard/customer/hire?workerId=${worker._id}`)}
              className="mt-6 w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Hire {worker.userId.name.split(' ')[0]}
            </button>
          </div>

          {/* Extra info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            {worker.yearsOfExperience > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium text-foreground">{worker.yearsOfExperience} year{worker.yearsOfExperience !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium text-foreground">{memberSince}</span>
            </div>
          </div>
        </div>

        {/* Right — details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {worker.bio && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{worker.bio}</p>
            </div>
          )}

          {/* Skills */}
          {worker.skills.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {worker.skills.map((skill) => (
                  <span key={skill} className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Customer reviews</h2>
              {worker.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <Stars rating={worker.averageRating} />
                  <span className="text-sm font-bold text-foreground">{worker.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {worker.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet — be the first to hire!</p>
            ) : (
              <div className="space-y-4">
                {worker.reviews.map((review) => (
                  <div key={review._id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{review.customerId.name}</span>
                        <Stars rating={review.rating} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}