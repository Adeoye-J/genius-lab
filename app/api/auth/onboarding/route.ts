// // POST — completes onboarding for workers or customers
// // Sets isOnboarded: true on the User, unblocking the middleware gate

// import { NextRequest, NextResponse } from 'next/server';
// import { requireAuth } from '@/lib/auth/auth';
// import { connectDB } from '@/lib/database/mongodb';
// import User from '@/models/User';
// import WorkerProfile from '@/models/Worker';
// import BankAccount from '@/models/BankAccount';
// import WorkerEarnings from '@/models/WorkerEarnings';
// import TrustScore from '@/models/TrustScore';
// import ActivityLog from '@/models/ActivityLog';
// import type { ApiResponse, WorkerOnboardingInput, CustomerOnboardingInput } from '@/types';

// export async function POST(req: NextRequest) {
//   try {
//     const currentUser = await requireAuth();
//     await connectDB();

//     const body = await req.json();

//     // ----------------------------------------------------------------
//     // Worker onboarding
//     // ----------------------------------------------------------------
//     if (currentUser.role === 'worker') {
//       const {
//         profession, skills, bio, city, state, address,
//         yearsOfExperience, bankName, accountName, accountNumber, bankCode,
//       } = body as WorkerOnboardingInput;

//       // Validate required fields
//       if (!profession || !city || !state || !bankName || !accountName || !accountNumber || !bankCode) {
//         return NextResponse.json<ApiResponse>(
//           { success: false, error: 'Missing required fields for worker onboarding' },
//           { status: 400 }
//         );
//       }

//       if (accountNumber.length !== 10) {
//         return NextResponse.json<ApiResponse>(
//           { success: false, error: 'Account number must be exactly 10 digits' },
//           { status: 400 }
//         );
//       }

//       // Check if worker profile already exists (idempotent)
//       const existingProfile = await WorkerProfile.findOne({ userId: currentUser.id });

//       let workerProfile;
//       if (existingProfile) {
//         // Update existing
//         workerProfile = await WorkerProfile.findOneAndUpdate(
//           { userId: currentUser.id },
//           { profession, skills: skills ?? [], bio, location: { city, state, address }, yearsOfExperience: yearsOfExperience ?? 0 },
//           { new: true }
//         );
//       } else {
//         // Create new profile
//         workerProfile = await WorkerProfile.create({
//           userId: currentUser.id,
//           profession,
//           skills: skills ?? [],
//           bio: bio ?? '',
//           location: { city, state, address: address ?? '' },
//           yearsOfExperience: yearsOfExperience ?? 0,
//           trustScore: 0,
//           totalJobsCompleted: 0,
//           averageRating: 0,
//         });

//         // Seed companion records
//         await Promise.all([
//           WorkerEarnings.create({ workerId: workerProfile._id }),
//           TrustScore.create({ workerId: workerProfile._id }),
//         ]);
//       }

//       // Upsert bank account
//       await BankAccount.findOneAndUpdate(
//         { workerId: workerProfile!._id },
//         { bankName, accountName, accountNumber, bankCode, verified: false },
//         { upsert: true, new: true }
//       );

//       // Mark onboarded
//       await User.findByIdAndUpdate(currentUser.id, { isOnboarded: true });

//       await ActivityLog.create({
//         userId: currentUser.id,
//         action: 'user.onboarding.worker',
//         metadata: { profession, city, state },
//         ipAddress: req.headers.get('x-forwarded-for') ?? '',
//       });

//       return NextResponse.json<ApiResponse>({
//         success: true,
//         message: 'Worker profile created successfully',
//       });
//     }

//     // ----------------------------------------------------------------
//     // Customer onboarding
//     // ----------------------------------------------------------------
//     if (currentUser.role === 'customer') {
//       const { name, preferredServices } = body as CustomerOnboardingInput;

//       if (name?.trim()) {
//         await User.findByIdAndUpdate(currentUser.id, {
//           name: name.trim(),
//           isOnboarded: true,
//         });
//       } else {
//         await User.findByIdAndUpdate(currentUser.id, { isOnboarded: true });
//       }

//       await ActivityLog.create({
//         userId: currentUser.id,
//         action: 'user.onboarding.customer',
//         metadata: { preferredServices: preferredServices ?? [] },
//         ipAddress: req.headers.get('x-forwarded-for') ?? '',
//       });

//       return NextResponse.json<ApiResponse>({
//         success: true,
//         message: 'Profile set up successfully',
//       });
//     }

//     return NextResponse.json<ApiResponse>(
//       { success: false, error: 'Unknown user role' },
//       { status: 400 }
//     );
//   } catch (error: unknown) {
//     const authErr = error as { name?: string; status?: number; message?: string };
//     if (authErr.name === 'AuthError') {
//       return NextResponse.json<ApiResponse>(
//         { success: false, error: authErr.message ?? 'Unauthorized' },
//         { status: authErr.status ?? 401 }
//       );
//     }
//     console.error('[/api/auth/onboarding]', error);
//     return NextResponse.json<ApiResponse>(
//       { success: false, error: 'Onboarding failed. Please try again.' },
//       { status: 500 }
//     );
//   }
// }


// app/api/auth/onboarding/route.ts
// POST — completes onboarding for workers or customers.
//
// KEY CHANGE for workers:
//   The body must include `bankVerified: true` and `accountName` populated
//   by the Interswitch resolve call (not typed by the user).
//   We re-verify on the server side to prevent client-side tampering.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
import { resolveAccount } from '@/lib/banking/isw-marketplace';
import User from '@/models/User';
import WorkerProfile from '@/models/Worker';
import BankAccount from '@/models/BankAccount';
import WorkerEarnings from '@/models/WorkerEarnings';
import TrustScore from '@/models/TrustScore';
import ActivityLog from '@/models/ActivityLog';
import type { ApiResponse, WorkerOnboardingInput, CustomerOnboardingInput } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth();
    await connectDB();

    const body = await req.json();

    // ── Worker onboarding ────────────────────────────────────────
    if (currentUser.role === 'worker') {
      const {
        profession, skills, bio, city, state, address,
        yearsOfExperience, bankName, accountNumber, bankCode,
        // bankVerified flag sent from client after successful resolve
        bankVerified,
      } = body as WorkerOnboardingInput & { bankVerified?: boolean };

      // Required field validation
      if (!profession || !city || !state || !bankCode || !accountNumber) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required fields for worker onboarding' },
          { status: 400 }
        );
      }

      if (!bankVerified) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error:   'Bank account must be verified before completing onboarding',
            code:    'BANK_NOT_VERIFIED',
          },
          { status: 400 }
        );
      }

      // ── Server-side re-verification ──────────────────────────
      // Even though the client already resolved, we resolve again server-side.
      // This prevents anyone from sending bankVerified:true without actually verifying.
      let verifiedAccountName: string;
      let verifiedBankName: string;

      try {
        const resolved = await resolveAccount(accountNumber, bankCode);
        verifiedAccountName = resolved.accountName;
        verifiedBankName    = resolved.bankName;
      } catch (err) {
        const e = err as { message?: string; status?: number };
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error:   e.message ?? 'Bank account verification failed. Please re-verify your account.',
            code:    'BANK_VERIFY_FAILED',
          },
          { status: e.status ?? 400 }
        );
      }

      // ── Upsert WorkerProfile ─────────────────────────────────
      const existingProfile = await WorkerProfile.findOne({ userId: currentUser.id });
      let workerProfile;

      if (existingProfile) {
        workerProfile = await WorkerProfile.findOneAndUpdate(
          { userId: currentUser.id },
          {
            profession,
            skills:            skills ?? [],
            bio:               bio ?? '',
            location:          { city, state, address: address ?? '' },
            yearsOfExperience: yearsOfExperience ?? 0,
          },
          { new: true }
        );
      } else {
        workerProfile = await WorkerProfile.create({
          userId:            currentUser.id,
          profession,
          skills:            skills ?? [],
          bio:               bio ?? '',
          location:          { city, state, address: address ?? '' },
          yearsOfExperience: yearsOfExperience ?? 0,
          trustScore:        0,
          totalJobsCompleted: 0,
          averageRating:     0,
        });

        // Seed companion records
        await Promise.all([
          WorkerEarnings.create({ workerId: workerProfile._id }),
          TrustScore.create({ workerId: workerProfile._id }),
        ]);
      }

      // ── Upsert BankAccount — use server-verified name ────────
      // verified: true because Interswitch confirmed it
      await BankAccount.findOneAndUpdate(
        { workerId: workerProfile!._id },
        {
          bankName:      bankName ?? verifiedBankName,
          accountName:   verifiedAccountName,   // from Interswitch — not user input
          accountNumber,
          bankCode,
          verified:      true,                  // server-verified
        },
        { upsert: true, new: true }
      );

      // ── Mark onboarded ───────────────────────────────────────
      await User.findByIdAndUpdate(currentUser.id, { isOnboarded: true });

      await ActivityLog.create({
        userId:    currentUser.id,
        action:    'user.onboarding.worker',
        metadata:  { profession, city, state, bankCode, accountVerified: true },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '',
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Worker profile created successfully',
        data:    { accountName: verifiedAccountName },
      });
    }

    // ── Customer onboarding ──────────────────────────────────────
    if (currentUser.role === 'customer') {
      const { name, preferredServices } = body as CustomerOnboardingInput;

      await User.findByIdAndUpdate(currentUser.id, {
        ...(name?.trim() ? { name: name.trim() } : {}),
        isOnboarded: true,
      });

      await ActivityLog.create({
        userId:    currentUser.id,
        action:    'user.onboarding.customer',
        metadata:  { preferredServices: preferredServices ?? [] },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '',
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Profile set up successfully',
      });
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Unknown user role' },
      { status: 400 }
    );
  } catch (error: unknown) {
    const e = error as { name?: string; status?: number; message?: string };
    if (e.name === 'AuthError') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: e.message ?? 'Unauthorized' },
        { status: e.status ?? 401 }
      );
    }
    console.error('[/api/auth/onboarding]', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Onboarding failed. Please try again.' },
      { status: 500 }
    );
  }
}