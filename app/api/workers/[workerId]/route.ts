// app/api/workers/[workerId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWorkerById } from '@/services/workerService';
import { connectDB } from '@/lib/database/mongodb';
import { Review } from '@/models/Review';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const {workerId} = await params
  try {
    const worker = await getWorkerById(workerId);
    if (!worker) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      );
    }

    await connectDB();

    // Fetch recent reviews for the public profile
    const reviews = await Review.find({ workerId: workerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name')
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { ...worker, reviews },
    });
  } catch (error) {
    return handleApiError(error, `GET /api/workers/${workerId}`);
  }
}