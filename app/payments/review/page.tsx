'use client';

// Shown after successful payment. Customer rates and reviews the worker.

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const jobId        = searchParams.get('jobId') ?? '';

  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit() {
    if (!rating) { setError('Please select a star rating'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to submit review');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Review submitted!</h2>
          <p className="text-muted-foreground text-sm mb-2">
            Your {rating}-star review has been recorded.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            It contributes to this worker&apos;s trust score and helps other customers make informed decisions.
          </p>
          <Link
            href="/dashboard/customer/history"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center"
          >
            Back to my jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Rate your experience</h1>
          <p className="text-muted-foreground text-sm">Your review helps build this worker&apos;s financial credibility</p>
        </div>

        {/* Star rating */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => { setRating(star); setError(''); }}
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              <svg
                className={`w-10 h-10 transition-colors ${
                  star <= (hovered || rating) ? 'text-amber-400' : 'text-muted-foreground/30'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-sm font-medium text-foreground mb-6">
            {['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent'][rating]}
          </p>
        )}

        {/* Comment */}
        <div className="mb-6">
          <label className="text-label mb-1.5 block">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe your experience — was the work done well? Was the worker professional and on time?"
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">{comment.length}/1000</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !rating}
          className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-60 mb-3"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Submitting…
            </span>
          ) : 'Submit review'}
        </button>

        <button
          onClick={() => router.push('/dashboard/customer/history')}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}