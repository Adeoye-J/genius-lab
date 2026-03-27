// GET  — returns the current user's full profile data for the edit form
// PATCH — updates name, profileImage, and role-specific fields

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/database/mongodb';
import User from '@/models/User';
import WorkerProfile from '@/models/Worker';
import { handleApiError } from '@/utils/errorHandler';
import type { ApiResponse } from '@/types';

// GET /api/user/profile — fetch current profile data
export async function GET(_req: NextRequest) {
  try {
    const currentUser = await requireAuth();
    await connectDB();

    const user = await User.findById(currentUser.id)
      .select('name email phone role profileImage isVerified createdAt')
      .lean();

    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 });
    }

    let workerProfile = null;
    if (currentUser.role === 'worker') {
      workerProfile = await WorkerProfile.findOne({ userId: currentUser.id })
        .select('profession skills bio location yearsOfExperience trustScore averageRating totalJobsCompleted isAvailable')
        .lean();
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user, workerProfile },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/user/profile');
  }
}

// PATCH /api/user/profile — update profile fields
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await requireAuth();
    await connectDB();

    const body = await req.json();

    // ── Fields any user can update ────────────────────────────
    const userUpdates: Record<string, unknown> = {};
    if (body.name?.trim())         userUpdates.name         = body.name.trim();
    if (body.profileImage !== undefined) userUpdates.profileImage = body.profileImage;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(currentUser.id, { $set: userUpdates });
    }

    // ── Worker-specific fields ────────────────────────────────
    if (currentUser.role === 'worker') {
      const workerUpdates: Record<string, unknown> = {};

      if (body.bio      !== undefined) workerUpdates.bio               = body.bio.slice(0, 500);
      if (body.skills   !== undefined) workerUpdates.skills             = body.skills;
      if (body.city     !== undefined) workerUpdates['location.city']   = body.city.trim();
      if (body.state    !== undefined) workerUpdates['location.state']  = body.state.trim();
      if (body.address  !== undefined) workerUpdates['location.address'] = body.address.trim();
      if (body.yearsOfExperience !== undefined) {
        workerUpdates.yearsOfExperience = Number(body.yearsOfExperience);
      }
      if (body.isAvailable !== undefined) workerUpdates.isAvailable = Boolean(body.isAvailable);

      if (Object.keys(workerUpdates).length > 0) {
        await WorkerProfile.findOneAndUpdate(
          { userId: currentUser.id },
          { $set: workerUpdates },
          { runValidators: true }
        );
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/user/profile');
  }
}