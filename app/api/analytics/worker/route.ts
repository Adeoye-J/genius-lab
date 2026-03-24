
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
import WorkerProfile from '@/models/Worker';
import { getWorkerAnalytics } from '@/services/analyticsService';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(_req: NextRequest) {
  try {
    const user = await requireRole('worker');
    await connectDB();

    const profile = await WorkerProfile.findOne({ userId: user.id }).lean();
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    const analytics = await getWorkerAnalytics(profile._id.toString());
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    return handleApiError(error, 'GET /api/analytics/worker');
  }
}