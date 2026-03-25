// import { NextRequest, NextResponse } from 'next/server';
// import { verifyAndSettlePayment } from '@/services/paymentService';
// import { handleApiError } from '@/utils/errorHandler';

// export async function POST(req: NextRequest) {
//   try {
//     const { transactionRef } = await req.json();
//     if (!transactionRef) {
//       return NextResponse.json({ success: false, error: 'transactionRef is required' }, { status: 400 });
//     }

//     console.log(transactionRef)

//     const result = await verifyAndSettlePayment(transactionRef);
//     return NextResponse.json({ success: true, data: result });
//   } catch (error) {
//     return handleApiError(error, 'POST /api/payments/verify');
//   }
// }

// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAndSettlePayment } from '@/services/paymentService';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const transactionRef = body.transactionRef ?? body.txnref ?? body.transactionReference ?? '';

    if (!transactionRef) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'transactionRef is required' },
        { status: 400 }
      );
    }

    const result = await verifyAndSettlePayment(transactionRef);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        status:         result.status,
        paymentId:      result.payment._id,
        jobId:          result.payment.jobId,
        amount:         result.payment.amount,
        transactionRef: result.payment.transactionReference,
        paidAt:         result.payment.paidAt,
      },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/payments/verify');
  }
}