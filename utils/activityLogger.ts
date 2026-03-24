
// Fire-and-forget activity logging.
// Call logActivity() anywhere — it never throws or blocks.

import { connectDB } from '@/lib/database/mongodb';
import ActivityLog from '@/models/ActivityLog';

export type ActivityAction =
  | 'user.register'
  | 'user.login'
  | 'user.logout'
  | 'user.onboarding.worker'
  | 'user.onboarding.customer'
  | 'job.created'
  | 'job.accepted'
  | 'job.started'
  | 'job.completed'
  | 'job.cancelled'
  | 'job.paid'
  | 'payment.initialized'
  | 'payment.verified'
  | 'payment.failed'
  | 'review.created'
  | 'worker.profile.updated'
  | string; // allow ad-hoc strings without breaking TS

export interface LogActivityParams {
  userId:    string;
  action:    ActivityAction;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  // Intentionally async-fire — callers don't await this
  connectDB()
    .then(() =>
      ActivityLog.create({
        userId:    params.userId,
        action:    params.action,
        metadata:  params.metadata ?? {},
        ipAddress: params.ipAddress ?? '',
      })
    )
    .catch((err) => {
      // Log to server output but never surface to the user
      console.error('[ActivityLog] Failed to write:', params.action, err?.message);
    });
}

// Convenience: extract IP from Next.js request headers
export function getIpFromHeaders(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    ''
  );
}