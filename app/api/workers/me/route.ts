
// GET — returns the current worker's full profile, earnings, and dashboard stats

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
import WorkerProfile from '@/models/Worker';
import WorkerEarnings from '@/models/WorkerEarnings';
import Job from '@/models/Job';
import type { ApiResponse } from '@/types';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireRole('worker');
    await connectDB();

    const profile = await WorkerProfile.findOne({ userId: user.id }).lean();
    if (!profile) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    const [earnings, pendingCount, activeCount] = await Promise.all([
      WorkerEarnings.findOne({ workerId: profile._id }).lean(),
      Job.countDocuments({ workerId: profile._id, status: 'requested' }),
      Job.countDocuments({ workerId: profile._id, status: { $in: ['accepted', 'in_progress'] } }),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...profile,
        earnings: earnings ?? { totalEarnings: 0, monthlyEarnings: 0 },
        pendingJobs: pendingCount,
        activeJobs:  activeCount,
      },
    });
  } catch (error: unknown) {
    const e = error as { name?: string; status?: number; message?: string };
    if (e.name === 'AuthError') {
      return NextResponse.json<ApiResponse>({ success: false, error: e.message }, { status: e.status ?? 401 });
    }
    console.error('[/api/workers/me]', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch worker profile' }, { status: 500 });
  }
}