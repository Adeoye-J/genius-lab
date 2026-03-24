'use client';

import { useState, useEffect } from 'react';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerId: { name: string };
  jobId: { title: string };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400' : 'text-muted-foreground/30'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function WorkerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvg]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState('');

  useEffect(() => {
    fetch('/api/workers/me').then((r) => r.json()).then((d) => {
      if (d.success) {
        setWorkerId(d.data._id);
        setAvg(d.data.averageRating ?? 0);
        return fetch(`/api/reviews/${d.data._id}?limit=50`);
      }
    }).then((r) => r?.json()).then((d) => {
      if (d?.success) setReviews(d.data.reviews);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Rating distribution
  const dist = [5,4,3,2,1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:   reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

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

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground mb-1">Reviews</h1>
        <p className="text-muted-foreground text-sm">What your customers say about you</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-semibold mb-2">No reviews yet</p>
          <p className="text-sm">Complete your first job to start receiving reviews</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6 flex items-center gap-8">
            <div className="text-center shrink-0">
              <p className="text-5xl font-extrabold text-foreground">{avgRating.toFixed(1)}</p>
              <Stars rating={avgRating} />
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-2">
              {dist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-3">{star}</span>
                  <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-muted-foreground w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual reviews */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{review.customerId.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">for: {review.jobId?.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Stars rating={review.rating} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(review.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}