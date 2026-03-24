// app/api/payments/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
import WorkerProfile from '@/models/Worker';
import { getWorkerPaymentHistory } from '@/services/paymentService';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page  = Number(searchParams.get('page')  ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);

    let workerId = searchParams.get('workerId') ?? '';

    // Workers fetch their own history; customers can't access this endpoint
    if (user.role === 'worker') {
      const profile = await WorkerProfile.findOne({ userId: user.id }).lean();
      if (!profile) return NextResponse.json({ success: true, data: { payments: [], pagination: { page, limit, total: 0, pages: 0 } } });
      workerId = profile._id.toString();
    } else {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const result = await getWorkerPaymentHistory(workerId, page, limit);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'GET /api/payments/history');
  }
}