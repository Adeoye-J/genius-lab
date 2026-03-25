import { NextRequest, NextResponse } from 'next/server';
import { checkReviewStatus } from '@/services/reviewService';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params;

  try {
    const result = await checkReviewStatus(jobId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, `GET /api/reviews/${jobId}`);
  }
}