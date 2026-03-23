import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

// ── Standardised API error handler ───────────────────────────────
// Use in every API route catch block:
//   return handleApiError(error, 'POST /api/auth/register')

export function handleApiError(error: unknown, context = 'API'): NextResponse {
  const e = error as {
    name?: string;
    status?: number;
    message?: string;
    code?: number;
    errors?: Record<string, { message: string }>;
  };

  // Auth errors (thrown by requireAuth / requireRole)
  if (e.name === 'AuthError') {
    return NextResponse.json<ApiResponse>(
      { success: false, error: e.message ?? 'Unauthorized' },
      { status: e.status ?? 401 }
    );
  }

  // MongoDB duplicate key
  if (e.code === 11000) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'A record with these details already exists' },
      { status: 409 }
    );
  }

  // Mongoose validation errors
  if (e.name === 'ValidationError' && e.errors) {
    const msg = Object.values(e.errors).map((v) => v.message).join(', ');
    return NextResponse.json<ApiResponse>(
      { success: false, error: msg },
      { status: 400 }
    );
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if (e.name === 'CastError') {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid ID format' },
      { status: 400 }
    );
  }

  // Manual status errors thrown in service layer
  // e.g. throw Object.assign(new Error('Job not found'), { status: 404 })
  if (e.status && e.message) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: e.message },
      { status: e.status }
    );
  }

  console.error(`[${context}]`, error);
  return NextResponse.json<ApiResponse>(
    { success: false, error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}

// ── Plain error message extractor ────────────────────────────────
// Use outside API routes when you just need the message string

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
}

// ── Tailwind class merging helper ─────────────────────────────────
// Kept here so there's one utils import for common helpers.
// Usage: className={cn('base-class', condition && 'conditional-class')}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}