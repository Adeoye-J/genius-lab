'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface WorkerSummary {
  _id: string;
  profession: string;
  trustScore: number;
  averageRating: number;
  userId: { name: string };
  location: { city: string; state: string };
}

export default function HirePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselectedWorkerId = searchParams.get('workerId') ?? '';

  const [worker, setWorker]       = useState<WorkerSummary | null>(null);
  const [workerId, setWorkerId]   = useState(preselectedWorkerId);
  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [price, setPrice]         = useState('');
  const [city, setCity]           = useState('');
  const [state, setState]         = useState('');
  const [scheduledDate, setDate]  = useState('');
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  // Fetch worker if preselected
  useEffect(() => {
    if (!preselectedWorkerId) return;
    fetch(`/api/workers/${preselectedWorkerId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setWorker(d.data); })
      .catch(() => {});
  }, [preselectedWorkerId]);

  function validate() {
    const e: Record<string, string> = {};
    if (!workerId.trim()) e.workerId = 'Enter a worker ID or go to the directory';
    if (!title.trim())    e.title    = 'Job title is required';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = 'Enter a valid price (₦)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: workerId.trim(),
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          location: { city: city.trim(), state: state.trim() },
          scheduledDate: scheduledDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setServerError(data.error ?? 'Failed to create job');
        return;
      }
      // Redirect to job detail page
      router.push(`/jobs/${data.data._id}`);
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-1">Hire a worker</h1>
        <p className="text-muted-foreground">Describe what you need and set a price. The worker will accept or decline.</p>
      </div>

      {/* Selected worker summary */}
      {worker && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-accent font-bold text-sm">
              {worker.userId.name.split(' ').map((n) => n[0]).join('').slice(0,2)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{worker.userId.name}</p>
            <p className="text-xs text-muted-foreground">{worker.profession} · {worker.location.city} · Trust score: {worker.trustScore}</p>
          </div>
          <button
            type="button"
            onClick={() => { setWorker(null); setWorkerId(''); }}
            className="ml-auto text-muted-foreground hover:text-foreground text-xs"
          >
            Change
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Worker ID (if not preselected) */}
        {!worker && (
          <div>
            <label className="text-label mb-1.5 block">Worker ID *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workerId}
                onChange={(e) => { setWorkerId(e.target.value); setErrors((p) => ({ ...p, workerId: '' })); }}
                placeholder="Paste worker ID from their profile"
                className={`flex-1 h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.workerId ? 'border-destructive' : 'border-input'}`}
              />
              <a href="/workers" className="h-11 px-4 flex items-center bg-muted text-muted-foreground text-sm rounded-lg hover:bg-muted/80 transition-all whitespace-nowrap">
                Browse workers
              </a>
            </div>
            {errors.workerId && <p className="mt-1 text-xs text-destructive">{errors.workerId}</p>}
          </div>
        )}

        {/* Job title */}
        <div>
          <label className="text-label mb-1.5 block">Job title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
            placeholder="e.g. Fix kitchen sink, Full car service, Repair ceiling fan"
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.title ? 'border-destructive' : 'border-input'}`}
          />
          {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-label mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the job in detail — what needs to be done, any materials required, specific instructions…"
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">{description.length}/2000</p>
        </div>

        {/* Price */}
        <div>
          <label className="text-label mb-1.5 block">Agreed price (₦) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₦</span>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: '' })); }}
              placeholder="5,000"
              className={`w-full h-11 pl-8 pr-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.price ? 'border-destructive' : 'border-input'}`}
            />
          </div>
          {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Discuss and agree the price with the worker before submitting</p>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-label mb-1.5 block">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lagos"
              className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-label mb-1.5 block">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Lagos"
              className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Scheduled date */}
        <div>
          <label className="text-label mb-1.5 block">Preferred date (optional)</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {serverError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 h-11 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-all"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sending request…
              </span>
            ) : 'Send job request'}
          </button>
        </div>
      </form>
    </div>
  );
}