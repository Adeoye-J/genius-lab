// Returns the list of all active Nigerian banks from the Interswitch Marketplace API.
// Results are cached in memory for 1 hour.
// Called by the onboarding bank step to populate the bank dropdown.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { getBankList } from '@/lib/banking/isw-marketplace';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

export async function GET(_req: NextRequest) {
  try {
    // Must be authenticated to fetch bank list
    await requireAuth();

    const banks = await getBankList();

    return NextResponse.json<ApiResponse>({
      success: true,
      data:    banks,
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/banking/banks');
  }
}