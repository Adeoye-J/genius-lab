import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { startJob } from '@/services/jobService';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await requireRole('worker');
    const job  = await startJob(params.jobId, user.id);
    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    return handleApiError(error, `POST /api/jobs/${params.jobId}/start`);
  }
}