// Interswitch posts here when a transaction status changes.
// Register this URL in your Quickteller Business Dashboard → Webhooks.
//
// URL to register: https://street-cred.vercel.app/api/payments/webhook
//
// The webhook payload contains the transaction reference.
// We do NOT trust the payload status — we call verifyTransaction() ourselves.

import { NextRequest, NextResponse } from 'next/server';
import { verifyAndSettlePayment } from '@/services/paymentService';

export async function POST(req: NextRequest) {
  try {
    let transactionRef: string | undefined;

    const contentType = req.headers.get('content-type') ?? '';

    // Interswitch may send JSON or form-encoded depending on configuration
    if (contentType.includes('application/json')) {
      const body = await req.json();
      transactionRef =
        body.transactionReference ??
        body.TransactionReference ??
        body.txnRef ??
        body.txnref ??
        body.merchantReference ??
        body.MerchantReference;
    } else {
      const form = await req.formData();
      transactionRef =
        form.get('transactionReference')?.toString() ??
        form.get('txnref')?.toString() ??
        form.get('txnRef')?.toString();
    }

    if (!transactionRef) {
      console.warn('[Webhook] No transaction reference in payload');
      // Return 200 so Interswitch stops retrying
      return NextResponse.json({ received: true });
    }

    // Fire and forget — respond immediately, settle in background
    verifyAndSettlePayment(transactionRef).catch((err) => {
      console.error('[Webhook] Settlement error for', transactionRef, ':', err.message);
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    // Always return 200 to stop Interswitch retry loop
    return NextResponse.json({ received: true });
  }
}