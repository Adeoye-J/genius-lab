// POST — completes onboarding for workers or customers
// Sets isOnboarded: true on the User, unblocking the middleware gate

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
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

    // ----------------------------------------------------------------
    // Worker onboarding
    // ----------------------------------------------------------------
    if (currentUser.role === 'worker') {
      const {
        profession, skills, bio, city, state, address,
        yearsOfExperience, bankName, accountName, accountNumber, bankCode,
      } = body as WorkerOnboardingInput;

      // Validate required fields
      if (!profession || !city || !state || !bankName || !accountName || !accountNumber || !bankCode) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required fields for worker onboarding' },
          { status: 400 }
        );
      }

      if (accountNumber.length !== 10) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Account number must be exactly 10 digits' },
          { status: 400 }
        );
      }

      // Check if worker profile already exists (idempotent)
      const existingProfile = await WorkerProfile.findOne({ userId: currentUser.id });

      let workerProfile;
      if (existingProfile) {
        // Update existing
        workerProfile = await WorkerProfile.findOneAndUpdate(
          { userId: currentUser.id },
          { profession, skills: skills ?? [], bio, location: { city, state, address }, yearsOfExperience: yearsOfExperience ?? 0 },
          { new: true }
        );
      } else {
        // Create new profile
        workerProfile = await WorkerProfile.create({
          userId: currentUser.id,
          profession,
          skills: skills ?? [],
          bio: bio ?? '',
          location: { city, state, address: address ?? '' },
          yearsOfExperience: yearsOfExperience ?? 0,
          trustScore: 0,
          totalJobsCompleted: 0,
          averageRating: 0,
        });

        // Seed companion records
        await Promise.all([
          WorkerEarnings.create({ workerId: workerProfile._id }),
          TrustScore.create({ workerId: workerProfile._id }),
        ]);
      }

      // Upsert bank account
      await BankAccount.findOneAndUpdate(
        { workerId: workerProfile!._id },
        { bankName, accountName, accountNumber, bankCode, verified: false },
        { upsert: true, new: true }
      );

      // Mark onboarded
      await User.findByIdAndUpdate(currentUser.id, { isOnboarded: true });

      await ActivityLog.create({
        userId: currentUser.id,
        action: 'user.onboarding.worker',
        metadata: { profession, city, state },
        ipAddress: req.headers.get('x-forwarded-for') ?? '',
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Worker profile created successfully',
      });
    }

    // ----------------------------------------------------------------
    // Customer onboarding
    // ----------------------------------------------------------------
    if (currentUser.role === 'customer') {
      const { name, preferredServices } = body as CustomerOnboardingInput;

      if (name?.trim()) {
        await User.findByIdAndUpdate(currentUser.id, {
          name: name.trim(),
          isOnboarded: true,
        });
      } else {
        await User.findByIdAndUpdate(currentUser.id, { isOnboarded: true });
      }

      await ActivityLog.create({
        userId: currentUser.id,
        action: 'user.onboarding.customer',
        metadata: { preferredServices: preferredServices ?? [] },
        ipAddress: req.headers.get('x-forwarded-for') ?? '',
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
    const authErr = error as { name?: string; status?: number; message?: string };
    if (authErr.name === 'AuthError') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: authErr.message ?? 'Unauthorized' },
        { status: authErr.status ?? 401 }
      );
    }
    console.error('[/api/auth/onboarding]', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Onboarding failed. Please try again.' },
      { status: 500 }
    );
  }
}