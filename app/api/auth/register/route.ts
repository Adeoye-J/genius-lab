// app/api/auth/register/route.ts
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
import type { RegisterInput, ApiResponse, SessionUser } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body: RegisterInput = await req.json();
    const { name, email, phone, password, role } = body;

    // ----------------------------------------------------------------
    // Validation
    // ----------------------------------------------------------------
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!['worker', 'customer'].includes(role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Role must be worker or customer' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------
    // Check for existing user
    // ----------------------------------------------------------------
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: phone.trim() },
      ],
    }).lean();

    if (existingUser) {
      const field = (existingUser as { email: string; phone: string }).email === email.toLowerCase().trim()
        ? 'email address'
        : 'phone number';
      return NextResponse.json<ApiResponse>(
        { success: false, error: `An account with this ${field} already exists` },
        { status: 409 }
      );
    }

    // ----------------------------------------------------------------
    // Hash password (bcrypt, cost factor 12)
    // Higher = more secure but slower. 12 is the production sweet spot.
    // ----------------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12);

    // ----------------------------------------------------------------
    // Create user
    // ----------------------------------------------------------------
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role,
      passwordHash,
      isVerified: false,
      isOnboarded: false,
      lastLogin: new Date(),
    });

    // ----------------------------------------------------------------
    // Create session
    // ----------------------------------------------------------------
    const token = generateSessionToken();
    await Session.create({
      userId: user._id,
      token,
      expiresAt: getSessionExpiry(),
    });

    // Set httpOnly cookie
    await setSessionCookie(token);

    // ----------------------------------------------------------------
    // Log activity
    // ----------------------------------------------------------------
    await ActivityLog.create({
      userId: user._id,
      action: 'user.register',
      metadata: { role, email: user.email },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '',
    });

    // ----------------------------------------------------------------
    // Return user (passwordHash excluded by model transform)
    // ----------------------------------------------------------------
    const responseUser: SessionUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isOnboarded: user.isOnboarded,
    };

    return NextResponse.json<ApiResponse<SessionUser>>(
      {
        success: true,
        data: responseUser,
        message: 'Account created successfully',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[/api/auth/register]', error);

    // MongoDB duplicate key (race condition — caught above but belt-and-suspenders)
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'An account with these details already exists' },
        { status: 409 }
      );
    }

    // Mongoose validation errors
    if ((error as { name?: string }).name === 'ValidationError') {
      const msg = Object.values(
        (error as { errors: Record<string, { message: string }> }).errors
      )
        .map((e) => e.message)
        .join(', ');
      return NextResponse.json<ApiResponse>(
        { success: false, error: msg },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}