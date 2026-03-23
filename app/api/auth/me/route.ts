// GET  — returns the current authenticated user
// DELETE — logs out (clears session)

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { clearSessionCookie, getSessionToken } from '@/lib/auth/session';
import { connectDB } from '@/lib/database/mongodb';
import Session from '@/models/Session';
import ActivityLog from '@/models/ActivityLog';
import type { ApiResponse, SessionUser } from '@/types';

// GET /api/auth/me
export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<{ user: SessionUser }>>({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('[/api/auth/me GET]', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/me — logout
export async function DELETE(req: NextRequest) {
  try {
    const token = await getSessionToken();

    if (token) {
      await connectDB();

      // Get userId before deleting for activity log
      const session = await Session.findOne({ token }).lean();

      // Delete session from DB
      await Session.deleteOne({ token });

      // Log the logout
      if (session) {
        await ActivityLog.create({
          userId: session.userId,
          action: 'user.logout',
          metadata: {},
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '',
        });
      }
    }

    // Clear the cookie
    await clearSessionCookie();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[/api/auth/me DELETE]', error);
    // Still clear the cookie even if DB operation fails
    await clearSessionCookie();
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}