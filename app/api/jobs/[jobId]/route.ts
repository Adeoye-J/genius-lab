import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { getJobWithTimeline } from '@/services/jobService';
import WorkerProfile from '@/models/Worker';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const {jobId} = await params
  try {
    const user = await requireAuth();
    const result = await getJobWithTimeline(jobId);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Authorisation: only the customer or assigned worker can view
    const workerProfile = user.role === 'worker'
      ? await WorkerProfile.findOne({ userId: user.id }).lean()
      : null;

    const isCustomer = result.customerId._id.toString() === user.id;
    const isWorker   = workerProfile && result.workerId._id.toString() === workerProfile._id.toString();

    if (!isCustomer && !isWorker && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, `GET /api/jobs/${jobId}`);
  }
}