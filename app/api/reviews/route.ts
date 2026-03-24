import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { createReview } from '@/services/reviewService';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('customer');
    const { jobId, rating, comment } = await req.json();

    if (!jobId)               return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    if (!rating)              return NextResponse.json({ success: false, error: 'rating is required' }, { status: 400 });
    if (rating < 1 || rating > 5) return NextResponse.json({ success: false, error: 'Rating must be 1–5' }, { status: 400 });

    const review = await createReview({ jobId, customerId: user.id, rating, comment });
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/reviews');
  }
}