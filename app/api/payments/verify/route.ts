import { NextRequest, NextResponse } from 'next/server';
import { verifyAndSettlePayment } from '@/services/paymentService';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const { transactionRef } = await req.json();
    if (!transactionRef) {
      return NextResponse.json({ success: false, error: 'transactionRef is required' }, { status: 400 });
    }

    const result = await verifyAndSettlePayment(transactionRef);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error, 'POST /api/payments/verify');
  }
}