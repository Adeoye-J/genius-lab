// app/api/payments/webhook/route.ts
// Interswitch posts here when a payment is confirmed asynchronously.
// Register this URL in your Interswitch merchant dashboard:
//   https://your-app.vercel.app/api/payments/webhook
//
// IMPORTANT: Verify the webhook signature in production.
// Interswitch sends a hash in the header — validate it to prevent spoofing.

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
// import { verifyAndSettlePayment } from '@/services/paymentService';
import { env } from '@/config/env';

export async function POST(req: NextRequest) {
  try {
    const body    = await req.text();
    const payload = JSON.parse(body);

    // ── Signature verification ────────────────────────────────────
    // Interswitch sends an X-Interswitch-Signature header.
    // We verify it using our CLIENT_SECRET as the HMAC key.
    // Skip in development when no secret is set.
    if (env.interswitchClientSecret && env.isProd) {
      const signature = req.headers.get('x-interswitch-signature') ?? '';
      const expected  = createHmac('sha512', env.interswitchClientSecret)
        .update(body)
        .digest('hex');

      if (signature !== expected) {
        console.warn('[Webhook] Invalid signature — rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // ── Extract transaction reference ─────────────────────────────
    // Interswitch webhook payload field names vary by plan/version.
    // Check both camelCase and PascalCase.
    const transactionRef =
      payload.transactionReference ??
      payload.TransactionReference ??
      payload.merchantReference ??
      payload.MerchantReference;

    if (!transactionRef) {
      console.warn('[Webhook] No transaction reference in payload:', payload);
      // Return 200 so Interswitch stops retrying
      return NextResponse.json({ received: true });
    }

    // Process asynchronously — don't await in the response cycle
    // (webhook expects a fast 200 response)
    // verifyAndSettlePayment(transactionRef).catch((err) => {
    //   console.error('[Webhook] Settlement error:', err.message);
    // });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Parse error:', error);
    return NextResponse.json({ received: true }); // always 200 to Interswitch
  }
}