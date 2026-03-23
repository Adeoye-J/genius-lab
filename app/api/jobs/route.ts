// GET — returns jobs for the authenticated user:
//   workers see their assigned jobs
//   customers see jobs they created

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { listJobs } from '@/services/jobService';
import WorkerProfile from '@/models/Worker';
import { connectDB } from '@/lib/database/mongodb';
import { handleApiError } from '@/utils/errorHandler';
import type { JobStatus } from '@/models/Job';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const page  = Number(searchParams.get('page')  ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);

    const status = statusParam
      ? (statusParam.includes(',') ? statusParam.split(',') as JobStatus[] : statusParam as JobStatus)
      : undefined;

    let workerId:   string | undefined;
    let customerId: string | undefined;

    if (user.role === 'worker') {
      const profile = await WorkerProfile.findOne({ userId: user.id }).lean();
      if (!profile) return NextResponse.json({ success: true, data: { jobs: [], pagination: { page, limit, total: 0, pages: 0 } } });
      workerId = profile._id.toString();
    } else {
      customerId = user.id;
    }

    const result = await listJobs({ workerId, customerId, status, page, limit });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'GET /api/jobs');
  }
}