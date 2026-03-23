// Handles session token creation, hashing, and cookie management.
// We use a simple signed token stored in an httpOnly cookie.
// The token itself is a UUID stored in the DB — no JWT needed for this use case.

import { v4 as uuidv4 } from 'uuid';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/config/constants';

// ----------------------------------------------------------------
// Token generation
// ----------------------------------------------------------------

/**
 * Generates a cryptographically random session token (UUID v4).
 * This is stored in the DB and in the cookie.
 */
export function generateSessionToken(): string {
  return uuidv4();
}

/**
 * Signs a token with HMAC-SHA256 using SESSION_SECRET.
 * The cookie stores token.signature — we verify on each request.
 * This prevents cookie forgery even if the DB is leaked.
 */
export function signToken(token: string): string {
  const sig = createHmac('sha256', env.sessionSecret)
    .update(token)
    .digest('hex');
  return `${token}.${sig}`;
}

/**
 * Verifies and extracts the raw token from a signed cookie value.
 * Returns null if the signature is invalid.
 */
export function verifySignedToken(signedToken: string): string | null {
  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const token = signedToken.slice(0, dotIndex);
  const providedSig = signedToken.slice(dotIndex + 1);

  const expectedSig = createHmac('sha256', env.sessionSecret)
    .update(token)
    .digest('hex');

  // Timing-safe comparison prevents timing attacks
  try {
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return token;
}

// ----------------------------------------------------------------
// Cookie helpers (server-side, Next.js App Router)
// ----------------------------------------------------------------

/**
 * Sets the session cookie in the response.
 * Call this after creating a new Session in the DB.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const signed = signToken(token);
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, signed, SESSION_COOKIE_OPTIONS);
}

/**
 * Reads and verifies the session cookie from the current request.
 * Returns the raw token (to look up in DB) or null.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySignedToken(cookie.value);
}

/**
 * Clears the session cookie.
 * Call this on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

// ----------------------------------------------------------------
// Session expiry
// ----------------------------------------------------------------

/**
 * Returns the expiry Date for a new session.
 */
export function getSessionExpiry(): Date {
  return new Date(Date.now() + env.sessionMaxAge * 1000);
}