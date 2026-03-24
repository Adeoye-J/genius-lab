import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { cancelJob } from '@/services/jobService';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const {jobId} = await params
  try {
    const user = await requireAuth();
    const { reason } = await req.json().catch(() => ({}));
    const job = await cancelJob(jobId, user.id, reason);
    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    return handleApiError(error, `POST /api/jobs/${jobId}/cancel`);
  }
}