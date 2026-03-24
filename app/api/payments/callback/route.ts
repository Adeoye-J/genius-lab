// Interswitch sends a browser-side HTML form POST to site_redirect_url
// after a transaction attempt. The form contains txnref, amount, resp, desc.
//
// IMPORTANT from the docs:
//   "The response parameters in this redirect should NOT be used to determine
//    transaction outcome. Merchants must perform a server-side requery."
//
// So this route:
//  1. Extracts txnref from the form POST body
//  2. Redirects the browser to /payments/callback?txnref=XX
//  3. That client page calls /api/payments/verify to do the real server-side check

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function POST(req: NextRequest) {
  try {
    // Interswitch sends application/x-www-form-urlencoded
    const formData = await req.formData();

    const txnref = formData.get('txnref')?.toString() ?? '';
    const resp   = formData.get('resp')?.toString()   ?? '';
    const amount = formData.get('amount')?.toString()  ?? '';

    if (!txnref) {
      // No reference — send to history page
      return NextResponse.redirect(new URL('/dashboard/customer/history', env.appUrl));
    }

    // Redirect to the client-side callback page which will call /api/payments/verify
    // We pass txnref as a query param — the actual verification happens server-side
    const callbackUrl = new URL('/payments/callback', env.appUrl);
    callbackUrl.searchParams.set('txnref', txnref);

    // Pass resp as a hint (not authoritative — the client page ignores it for decisions)
    if (resp) callbackUrl.searchParams.set('resp', resp);

    return NextResponse.redirect(callbackUrl, { status: 303 }); // 303 = redirect as GET
  } catch (error) {
    console.error('[/api/payments/callback]', error);
    return NextResponse.redirect(new URL('/dashboard/customer/history', env.appUrl));
  }
}

// Also handle GET in case Interswitch sends a redirect instead of form POST
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txnref = searchParams.get('txnref') ?? searchParams.get('transactionreference') ?? '';

  if (!txnref) {
    return NextResponse.redirect(new URL('/dashboard/customer/history', env.appUrl));
  }

  const callbackUrl = new URL('/payments/callback', env.appUrl);
  callbackUrl.searchParams.set('txnref', txnref);
  return NextResponse.redirect(callbackUrl, { status: 303 });
}