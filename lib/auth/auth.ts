// Server-side auth helper. Used in API routes and Server Components.
// Returns the current user from the session cookie, or null.

import { connectDB } from '@/lib/database/mongodb';
import { getSessionToken } from '@/lib/auth/session';
import Session from '@/models/Session';
import User, { IUser } from '@/models/User';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'worker' | 'customer' | 'admin';
  profileImage: string | undefined;
  isVerified: boolean;
  isOnboarded: boolean;
}

/**
 * Reads the session cookie, validates it against the DB,
 * and returns the current user — or null if not authenticated.
 *
 * Use in:
 *  - API route handlers (to protect endpoints)
 *  - Server Components (to render auth-aware UI)
 *  - proxy.ts (indirectly via /api/auth/me)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  await connectDB();

  // Find the session
  const session = await Session.findOne({
    token,
    expiresAt: { $gt: new Date() }, // Not expired
  }).lean();

  if (!session) return null;

  // Find the user
  const user = await User.findById(session.userId).lean() as IUser | null;
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    isOnboarded: user.isOnboarded,
  };
}

/**
 * Like getCurrentUser but throws a 401-style error if not authenticated.
 * Use in API routes that require auth.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

/**
 * Requires auth AND a specific role.
 */
export async function requireRole(role: AuthUser['role']): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new AuthError('Forbidden: insufficient role', 403);
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}