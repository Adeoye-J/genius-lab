// Calls Interswitch Marketplace to verify an account number against a bank
// and return the account holder name.
//
// Called live from the onboarding Step 3 UI when the worker enters their
// account number — auto-fills and locks the account name field.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { resolveAccount } from '@/lib/banking/isw-marketplace';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'accountNumber and bankCode are required' },
        { status: 400 }
      );
    }

    const result = await resolveAccount(accountNumber, bankCode);

    return NextResponse.json<ApiResponse>({
      success: true,
      data:    result,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/banking/resolve');
  }
}