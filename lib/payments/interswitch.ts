// lib/payments/interswitch.ts
//
// Interswitch Web Checkout integration.
//
// HOW IT WORKS (from the docs):
//
//  Step 1 — Generate access token
//    POST {passportUrl}/passport/oauth/token?grant_type=client_credentials
//    Authorization: Basic base64(clientId:secretKey)
//    Token expires in `expires_in` seconds (typically 86400 = 24hrs)
//
//  Step 2 — Inline Checkout
//    Load their JS widget on the payment page:
//      <script src="https://newwebpay.interswitchng.com/inline-checkout.js">
//    Call window.webpayCheckout({ merchant_code, pay_item_id, txn_ref,
//      amount, currency, access_token, site_redirect_url, onComplete })
//    The widget opens as a popup — customer never leaves your page.
//    onComplete callback fires when done (but DO NOT trust it for final status).
//
//  Step 3 — Server-side verify BEFORE giving value
//    After onComplete / redirect callback fires:
//    GET {baseUrl}/collections/api/v1/gettransaction.json
//      ?merchantcode=XX&transactionreference=XX&amount=XX
//    Match ResponseCode === '00' AND Amount matches original charge.

import { env } from '@/config/env';

// ── URLs ──────────────────────────────────────────────────────────
// Separate passport URL from the collections/webpay base URL.
// QA (sandbox): passport = qa.interswitchng.com, webpay = newwebpay.qa.interswitchng.com
// Production:   passport = passport.interswitchng.com, webpay = webpay.interswitchng.com

export function getPassportUrl(): string {
  return env.interswitchPassportUrl ?? (
    env.isProd
      // ? 'https://passport.interswitchng.com'
      ? 'https://qa.interswitchng.com'
      : 'https://qa.interswitchng.com'
  );
}

export function getWebpayBaseUrl(): string {
  return env.interswitchBaseUrl ?? (
    env.isProd
    //   ? 'https://webpay.interswitchng.com'
      ? 'https://qa.interswitchng.com'
      : 'https://qa.interswitchng.com'
  );
}

export function getInlineScriptUrl(): string {
  return env.isProd
    // ? 'https://newwebpay.interswitchng.com/inline-checkout.js'
    ? 'https://newwebpay.qa.interswitchng.com/inline-checkout.js'
    : 'https://newwebpay.qa.interswitchng.com/inline-checkout.js';
}

// ── Types ─────────────────────────────────────────────────────────

export interface CheckoutParams {
  transactionRef:  string;   // unique ref we generate — e.g. SC-XXXXXXXXXXXXXXXX
  amountKobo:      number;   // amount × 100 (Interswitch wants minor units)
  customerEmail:   string;
  customerName?:   string;
  customerId?:     string;
  description?:    string;
  callbackUrl:     string;   // site_redirect_url — where browser is sent after payment
}

export interface CheckoutConfig {
  // These are passed to window.webpayCheckout() in the browser
  merchant_code:     string;
  pay_item_id:       string;
  txn_ref:           string;
  amount:            number;   // in kobo
  currency:          number;   // ISO 4217 numeric — 566 for NGN
  cust_email:        string;
  cust_name?:        string;
  cust_id?:          string;
  site_redirect_url: string;
  access_token:      string;   // from passport — injected server-side
  mode:              'TEST' | 'LIVE';
}

export interface VerifyResult {
  transactionRef:   string;
  status:           'successful' | 'failed' | 'pending';
  amountKobo:       number;   // as returned by Interswitch
  amountNGN:        number;   // amountKobo / 100
  responseCode:     string;
  responseMessage:  string;
  paymentReference: string;
  retrievalRef:     string;
  transactionDate:  string;
}

// ── Token cache ───────────────────────────────────────────────────
// Token is valid for up to 86400s (24hrs). Cache it in memory.
// In serverless (Vercel), this cache lives per-instance — a new
// instance will re-fetch on its first request. That's fine.

interface TokenCache {
  token:     string;
  expiresAt: number; // Date.now() ms
}

let _tokenCache: TokenCache | null = null;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if it has > 5 minutes left
  if (_tokenCache && _tokenCache.expiresAt > now + 5 * 60 * 1000) {
    return _tokenCache.token;
  }

  // Encode credentials — Base64(clientId:secretKey)
  // This matches exactly what the docs show
  const credentials = Buffer.from(
    `${env.interswitchClientId}:${env.interswitchClientSecret}`
  ).toString('base64');

  const passportUrl = getPassportUrl();

  const res = await fetch(
    `${passportUrl}/passport/oauth/token?grant_type=client_credentials`,
    {
      method: 'POST',
      headers: {
        // Docs: "Authorization: Basic <base64 encoded clientId:secretKey>"
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Interswitch] Token fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error('[Interswitch] No access_token in response');
  }

  _tokenCache = {
    token:     data.access_token,
    // expires_in is in seconds; subtract 5min buffer
    expiresAt: now + ((data.expires_in ?? 3600) - 300) * 1000,
  };

  // Expose extra fields from token response for logging/debugging
  console.log('[Interswitch] Token refreshed. merchant_code:', data.merchant_code);

  return _tokenCache.token;
}

// ── Build checkout config ─────────────────────────────────────────
// Called server-side in the initialize API route.
// Returns the object to pass to window.webpayCheckout() in the browser.

export async function buildCheckoutConfig(
  params: CheckoutParams
): Promise<CheckoutConfig> {
  const token = await getAccessToken();

  return {
    merchant_code:     env.interswitchMerchantCode,
    pay_item_id:       env.interswitchPayItemId,
    txn_ref:           params.transactionRef,
    amount:            params.amountKobo,
    currency:          566, // NGN ISO 4217 numeric code
    cust_email:        params.customerEmail,
    cust_name:         params.customerName,
    cust_id:           params.customerId,
    site_redirect_url: params.callbackUrl,
    access_token:      token,
    // mode:              env.isProd ? 'LIVE' : 'TEST',
    mode:              env.isProd ? 'TEST' : 'TEST',
  };
}

// ── Verify transaction (server-side — MUST be called before giving value) ──
// Docs: GET /collections/api/v1/gettransaction.json
//   ?merchantcode=XX&transactionreference=XX&amount=XX
//
// IMPORTANT: Match BOTH ResponseCode === '00' AND Amount === original charge.
// The redirect callback (POST to site_redirect_url) also contains resp=00
// but the docs explicitly warn: "Do not rely on this — perform a requery instead."

export async function verifyTransaction(
  transactionRef: string,
  expectedAmountKobo: number
): Promise<VerifyResult> {
  const baseUrl = getWebpayBaseUrl();

  const url = new URL(`${baseUrl}/collections/api/v1/gettransaction.json`);
  url.searchParams.set('merchantcode',          env.interswitchMerchantCode);
  url.searchParams.set('transactionreference',  transactionRef);
  url.searchParams.set('amount',                String(expectedAmountKobo));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Interswitch] Verify failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  const responseCode = data.ResponseCode ?? data.responseCode ?? '';
  const returnedAmount = Number(data.Amount ?? 0);

  // '00' = Approved by Financial Institution
  const approved = responseCode === '00';

  // Amount guard — CRITICAL: verify returned amount matches what we charged
  // Interswitch returns amount in kobo
  const amountMatches = returnedAmount === expectedAmountKobo;

  let status: VerifyResult['status'];
  if (approved && amountMatches) {
    status = 'successful';
  } else if (approved && !amountMatches) {
    // Approved but wrong amount — possible tampering, treat as failed
    console.error(
      `[Interswitch] Amount mismatch on ${transactionRef}: ` +
      `expected ${expectedAmountKobo} kobo, got ${returnedAmount} kobo`
    );
    status = 'failed';
  } else {
    // Non-00 codes that are terminal failures
    const failedCodes = ['01', 'Z6', 'T1', '05', '51', '54', '57', '61', '62', '91'];
    status = failedCodes.includes(responseCode) ? 'failed' : 'pending';
  }

  return {
    transactionRef,
    status,
    amountKobo:       returnedAmount,
    amountNGN:        Math.round(returnedAmount / 100),
    responseCode,
    responseMessage:  data.ResponseDescription ?? data.responseDescription ?? '',
    paymentReference: data.PaymentReference ?? '',
    retrievalRef:     data.RetrievalReferenceNumber ?? '',
    transactionDate:  data.TransactionDate ?? '',
  };
}