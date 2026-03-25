import { NextResponse } from 'next/server';
import { checkReviewStatus } from '@/services/reviewService';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(
  { params }: { params: Promise<{ JobId: string }> }
) {
    const {JobId} = await params
  try {
    const result = await checkReviewStatus(JobId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, `GET /api/reviews/${JobId}`);
  }
}