
// Handles: session validation, onboarding gate, role-based routing.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/config/constants';
import { verifySignedToken } from '@/lib/auth/session';
import { connectDB } from '@/lib/database/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'];

// Routes only accessible when NOT logged in
const AUTH_ONLY_ROUTES = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p));

  // ----------------------------------------------------------------
  // 1. No cookie — redirect unauthenticated access to protected routes
  // ----------------------------------------------------------------
  if (!signedCookie) {
    if (isProtected) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ----------------------------------------------------------------
  // 2. Has a cookie — only validate for routes that need it
  // ----------------------------------------------------------------
  if (!isProtected && !isAuthOnly) {
    return NextResponse.next();
  }

  // ----------------------------------------------------------------
  // 3. Verify cookie signature + look up session in DB directly
  //    (Node.js runtime means we can use mongoose here)
  // ----------------------------------------------------------------
  let user: { role: string; isOnboarded: boolean } | null = null;

  try {
    const token = verifySignedToken(signedCookie);

    if (token) {
      await connectDB();

      const session = await Session.findOne({
        token,
        expiresAt: { $gt: new Date() },
      }).lean();

      if (session) {
        const dbUser = await User.findById(session.userId)
          .select('role isOnboarded')
          .lean();

        if (dbUser) {
          user = { role: dbUser.role, isOnboarded: dbUser.isOnboarded };
        }
      }
    }
  } catch {
    user = null;
  }

  // ----------------------------------------------------------------
  // 4. Invalid or expired session
  // ----------------------------------------------------------------
  if (!user) {
    if (isProtected) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }
    return NextResponse.next();
  }

  // ----------------------------------------------------------------
  // 5. Authenticated — redirect away from login/register
  // ----------------------------------------------------------------
  if (isAuthOnly) {
    const dest = user.role === 'worker' ? '/dashboard/worker' : '/dashboard/customer';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ----------------------------------------------------------------
  // 6. Onboarding gate
  // ----------------------------------------------------------------
  if (pathname.startsWith('/dashboard') && !user.isOnboarded) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // ----------------------------------------------------------------
  // 7. Role-based routing
  // ----------------------------------------------------------------
  if (pathname.startsWith('/dashboard/worker') && user.role !== 'worker' && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/customer', request.url));
  }
  if (pathname.startsWith('/dashboard/customer') && user.role !== 'customer' && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard/worker', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};