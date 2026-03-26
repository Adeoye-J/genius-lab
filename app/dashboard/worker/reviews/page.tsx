'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customerId: { name: string };
  jobId: { title: string };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function WorkerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState('');

  useEffect(() => {
    fetch('/api/workers/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setWorkerId(d.data._id);
          setAvg(d.data.averageRating ?? 0);
          return fetch(`/api/reviews/${d.data._id}?limit=50`);
        }
      })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.success) setReviews(d.data.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center text-center py-16">
          <div className="flex flex-col gap-3 items-center justify-center h-64">
            <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-foreground/60">Loading your reviews...</p>
          </div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
         <p className="text-foreground font-semibold text-xl mb-1 capitalize">Reviews</p>
          <p className="text-sm text-foreground/60">What your customers say about you</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-card border border-gray-200 rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <Star size={24} className="text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-1">No reviews yet</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Complete your first job to start receiving reviews</p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-surface-muted border border-gray-200 rounded-lg p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Average Rating */}
              <div className="flex flex-col items-center justify-center md:border-r border-gray-200 md:pr-8">
                <div className="mb-3">
                  <span className="text-5xl font-bold text-gray-900 dark:text-gray-200">{avgRating.toFixed(1)}</span>
                  <span className="text-lg text-gray-500 dark:text-gray-300 ml-2">/ 5.0</span>
                </div>
                <div className="mb-2">
                  <StarRating rating={avgRating} />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-4">Rating breakdown</p>
                <div className="space-y-3">
                  {dist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-6">{star}</span>
                      <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-yellow-400 to-yellow-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-4">Recent reviews</p>
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-surface-muted border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">{review.customerId.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">For: {review.jobId?.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StarRating rating={review.rating} />
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
