// app/api/payments/repair/route.ts
// One-time repair endpoint for payments that succeeded but left
// WorkerEarnings / TrustScore / WorkerProfile in an inconsistent state.
//
// Call once from Postman or curl after deploying the fix:
//   POST /api/payments/repair
//   Authorization: your session cookie
//
// Safe to run multiple times — all updates are idempotent.

// import { NextRequest, NextResponse } from 'next/server';
// import { requireAuth } from '@/lib/auth/auth';
// import { repairPaidPayments } from '@/services/paymentService';
// import { handleApiError } from '@/utils/errorHandler';

// export async function POST(_req: NextRequest) {
//   try {
//     // Any authenticated user can trigger repair for now
//     // Change to requireRole('admin') once you have admin accounts
//     await requireAuth();

//     console.log('[Repair] Starting payment repair...');
//     const results = await repairPaidPayments();

//     const succeeded = results.filter((r) => r.ok).length;
//     const failed    = results.filter((r) => !r.ok).length;

//     console.log(`[Repair] Done: ${succeeded} repaired, ${failed} failed`);

//     return NextResponse.json({
//       success: true,
//       data: {
//         total: results.length,
//         succeeded,
//         failed,
//         results,
//       },
//     });
//   } catch (error) {
//     return handleApiError(error, 'POST /api/payments/repair');
//   }
// }

console.log("test")