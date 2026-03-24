import { NextRequest, NextResponse } from 'next/server';
import { getWorkerReviews } from '@/services/reviewService';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(
  req: NextRequest,
  { params }: { params: { workerId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Number(searchParams.get('page')  ?? 1);
    const limit = Number(searchParams.get('limit') ?? 10);
    const result = await getWorkerReviews(params.workerId, page, limit);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, `GET /api/reviews/${params.workerId}`);
  }
}