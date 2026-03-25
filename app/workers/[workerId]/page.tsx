'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';

export default function WorkerProfilePage() {
  const { workerId } = useParams<{ workerId: string }>();
  const router = useRouter();

  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workers/${workerId}`)
      .then((r) => r.json())
      .then((d) => setWorker(d.data))
      .finally(() => setLoading(false));
  }, [workerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center text-center py-16">
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading worker's profile...</p>
          </div>
        </div>
    );
  }

  if (!worker) return null;

  const initials = worker.userId.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen">

      {/* 🔥 HERO */}
      <div className="gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">

          <Link
            href="/workers"
            className="text-sm flex items-center gap-2 opacity-80 hover:opacity-100 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
            Back to workers
          </Link>

          <div className="mt-8 flex flex-col md:flex-row md:items-center gap-8">

            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-3xl font-bold border border-white/20 glow-primary">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold capitalize">
                {worker.userId.name}
              </h1>

              <p className="text-white/80">{worker.profession}</p>
              <p className="text-white/60 text-sm">
                {worker.location.city}, {worker.location.state}
              </p>

              <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mt-2 ${
                worker.isAvailable
                  ? 'bg-accent/20 text-accent'
                  : 'bg-white/10 text-white/60'
              }`}>
                {worker.isAvailable ? 'Available for work' : 'Unavailable'}
              </span>
            </div>

            {/* Rating */}
            <div className="text-left md:text-right">
              <p className="text-3xl font-bold flex items-center gap-1">
                {worker.averageRating?.toFixed(1) || '—'}
                <Star size={18} className="text-yellow-400" />
              </p>
              <p className="text-sm text-white/60">Rating</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Trust Score', value: `${worker.trustScore}%` },
              { label: 'Jobs Completed', value: worker.totalJobsCompleted },
              { label: 'Experience', value: `${worker.yearsOfExperience} yrs` },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur"
              >
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-white/70 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🧾 MAIN */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">

          {/* About */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-3">About</h2>
            <p className="text-muted-foreground leading-relaxed">
              {worker.bio}
            </p>
          </div>

          {/* Skills */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-sm bg-accent/10 text-accent border border-accent/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-6">Reviews</h2>

            <div className="space-y-6">
              {worker.reviews.map((r: any) => (
                <div key={r._id} className="border-b pb-4 last:border-0">

                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{r.customerId.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-yellow-500 text-sm mb-1">
                    ⭐ {r.rating}
                  </p>

                  <p className="text-muted-foreground text-sm">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 👉 RIGHT (Hire Card) */}
        <div>
          <div className="sticky top-6 bg-card border border-border rounded-xl p-6 shadow-md space-y-5">

            {/* Trust Bar */}
            <div>
              <p className="text-sm text-muted-foreground">Trust Score</p>
              <div className="w-full bg-muted h-2 rounded-full mt-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{ width: `${worker.trustScore}%` }}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() =>
                router.push(`/dashboard/customer/hire?workerId=${worker._id}`)
              }
              className="w-full py-3 rounded-lg font-semibold btn-accent glow-accent cursor-pointer"
            >
              Hire {worker.userId.name.split(' ')[0]}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Member since {new Date(worker.userId.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}