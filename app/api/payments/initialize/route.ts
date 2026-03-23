import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { initializeJobPayment } from '@/services/paymentService';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('customer');
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const result = await initializeJobPayment(jobId, user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'POST /api/payments/initialize');
  }
}