// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/database/mongodb';
import {
  generateSessionToken,
  setSessionCookie,
  getSessionExpiry,
} from '@/lib/auth/session';
import User from '@/models/User';
import Session from '@/models/Session';
import ActivityLog from '@/models/ActivityLog';
import type { LoginInput, ApiResponse, SessionUser } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body: LoginInput = await req.json();
    const { email, password } = body;

    // ----------------------------------------------------------------
    // Validation
    // ----------------------------------------------------------------
    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------
    // Find user — select passwordHash explicitly (excluded by default transform)
    // ----------------------------------------------------------------
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash') // Override the transform exclusion
      .exec();

    // ----------------------------------------------------------------
    // Timing-safe auth: always run bcrypt.compare even if user not found.
    // This prevents timing attacks that could enumerate valid emails.
    // ----------------------------------------------------------------
    const dummyHash = '$2b$12$invalidhashtopreventtimingattackXXXXXXXXXXXXXX';
    const hashToCompare = user?.passwordHash ?? dummyHash;
    const passwordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ----------------------------------------------------------------
    // Invalidate existing sessions for this user (single-session model)
    // Remove this block if you want to allow multiple concurrent sessions
    // ----------------------------------------------------------------
    await Session.deleteMany({ userId: user._id });

    // ----------------------------------------------------------------
    // Create new session
    // ----------------------------------------------------------------
    const token = generateSessionToken();
    await Session.create({
      userId: user._id,
      token,
      expiresAt: getSessionExpiry(),
    });

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Set httpOnly cookie
    await setSessionCookie(token);

    // ----------------------------------------------------------------
    // Log activity
    // ----------------------------------------------------------------
    await ActivityLog.create({
      userId: user._id,
      action: 'user.login',
      metadata: { email: user.email },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '',
    });

    const responseUser: SessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isOnboarded: user.isOnboarded,
    };

    return NextResponse.json<ApiResponse<SessionUser>>({
      success: true,
      data: responseUser,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[/api/auth/login]', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}