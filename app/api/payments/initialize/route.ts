// Returns the checkout config object for window.webpayCheckout().
// The access_token is fetched server-side so it never touches the client bundle.

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/auth';
import { initializeJobPayment } from '@/services/paymentService';
import { getInlineScriptUrl } from '@/lib/payments/interswitch';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('customer');
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      );
    }

    const { config, transactionRef, amountKobo } = await initializeJobPayment(jobId, user.id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        // The checkout config — pass to window.webpayCheckout() verbatim
        checkoutConfig: config,
        // The inline script URL to load in the browser
        scriptUrl:      getInlineScriptUrl(),
        // Keep transactionRef on the client for the callback verification
        transactionRef,
        amountKobo,
      },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/payments/initialize');
  }
}