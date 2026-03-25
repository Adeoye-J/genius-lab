// 'use client';

// import { useState, useEffect } from 'react';

// interface Review {
//   _id: string;
//   rating: number;
//   comment: string;
//   createdAt: string;
//   customerId: { name: string };
//   jobId: { title: string };
// }

// function Stars({ rating }: { rating: number }) {
//   return (
//     <div className="flex gap-0.5">
//       {[1,2,3,4,5].map((s) => (
//         <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400' : 'text-muted-foreground/30'}`} fill="currentColor" viewBox="0 0 20 20">
//           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
//         </svg>
//       ))}
//     </div>
//   );
// }

// export default function WorkerReviewsPage() {
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [avgRating, setAvg]   = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [workerId, setWorkerId] = useState('');

//   useEffect(() => {
//     fetch('/api/workers/me').then((r) => r.json()).then((d) => {
//       if (d.success) {
//         setWorkerId(d.data._id);
//         setAvg(d.data.averageRating ?? 0);
//         return fetch(`/api/reviews/${d.data._id}?limit=50`);
//       }
//     }).then((r) => r?.json()).then((d) => {
//       if (d?.success) setReviews(d.data.reviews);
//     }).catch(() => {}).finally(() => setLoading(false));
//   }, []);

//   // Rating distribution
//   const dist = [5,4,3,2,1].map((star) => ({
//     star,
//     count: reviews.filter((r) => r.rating === star).length,
//     pct:   reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
//   }));

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center text-center py-16">
//         <div className="flex flex-col gap-3 items-center justify-center h-64">
//           <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//           </svg>
//           <p className="text-sm text-foreground/60">Loading your reviews...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl animate-fade-in">
//       <div className="mb-8">
//          <p className="text-foreground font-semibold text-xl mb-1 capitalize">Reviews</p>
//           <p className="text-sm text-foreground/60">What your customers say about you</p>
//       </div>

//       {reviews.length === 0 ? (
//         <div className="text-center py-16 text-muted-foreground">
//           <p className="text-lg font-semibold mb-2">No reviews yet</p>
//           <p className="text-sm">Complete your first job to start receiving reviews</p>
//         </div>
//       ) : (
//         <>
//           {/* Summary */}
//           <div className="bg-card border border-border rounded-xl p-6 mb-6 flex items-center gap-8">
//             <div className="text-center shrink-0">
//               <p className="text-5xl font-extrabold text-foreground">{avgRating.toFixed(1)}</p>
//               <Stars rating={avgRating} />
//               <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
//             </div>
//             <div className="flex-1 space-y-2">
//               {dist.map(({ star, count, pct }) => (
//                 <div key={star} className="flex items-center gap-2 text-xs">
//                   <span className="text-muted-foreground w-3">{star}</span>
//                   <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
//                   </svg>
//                   <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
//                     <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
//                   </div>
//                   <span className="text-muted-foreground w-6 text-right">{count}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Individual reviews */}
//           <div className="space-y-4">
//             {reviews.map((review) => (
//               <div key={review._id} className="bg-card border border-border rounded-xl p-5">
//                 <div className="flex items-start justify-between gap-4 mb-3">
//                   <div>
//                     <p className="font-semibold text-foreground text-sm capitalize">{review.customerId.name}</p>
//                     <p className="text-xs text-muted-foreground mt-0.5">for: {review.jobId?.title}</p>
//                   </div>
//                   <div className="text-right shrink-0">
//                     <Stars rating={review.rating} />
//                     <p className="text-xs text-muted-foreground mt-1">
//                       {new Date(review.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
//                     </p>
//                   </div>
//                 </div>
//                 {review.comment && (
//                   <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
//                 )}
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


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
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <Star size={24} className="text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">No reviews yet</p>
          <p className="text-sm text-gray-600">Complete your first job to start receiving reviews</p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Average Rating */}
              <div className="flex flex-col items-center justify-center md:border-r border-gray-200 md:pr-8">
                <div className="mb-3">
                  <span className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  <span className="text-lg text-gray-500 ml-2">/ 5.0</span>
                </div>
                <div className="mb-2">
                  <StarRating rating={avgRating} />
                </div>
                <p className="text-xs text-gray-600">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-900 mb-4">Rating breakdown</p>
                <div className="space-y-3">
                  {dist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-6">{star}</span>
                      <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-yellow-400 to-yellow-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-900 mb-4">Recent reviews</p>
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{review.customerId.name}</p>
                    <p className="text-xs text-gray-500 mt-1">For: {review.jobId?.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StarRating rating={review.rating} />
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
