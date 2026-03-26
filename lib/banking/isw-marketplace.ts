// lib/banking/isw-marketplace.ts
//
// Interswitch Marketplace API — Bank Account Verification
//
// Uses SEPARATE credentials from the payments API.
// Client ID + Secret come from your Marketplace developer console.
//
// Two endpoints used:
//   GET  /verify/identity/account-number/bank-list  → list all Nigerian banks
//   POST /verify/identity/account-number/resolve    → verify account number + get account name

import { env } from '@/config/env';

// ── Types ─────────────────────────────────────────────────────────

export interface BankListItem {
  id:       number;
  name:     string;
  slug:     string;
  code:     string;       // use this as bankCode when resolving
  longCode: string;
  active:   boolean;
  country:  string;
  currency: string;
  type:     string;
}

export interface ResolveAccountResult {
  accountName:   string;
  accountNumber: string;
  bankName:      string;
  bankCode:      string;
  verified:      boolean;
}

// ── Token cache — separate from payments token ────────────────────
interface TokenCache { token: string; expiresAt: number; }
let _marketplaceTokenCache: TokenCache | null = null;

async function getMarketplaceToken(): Promise<string> {
  const now = Date.now();

  if (_marketplaceTokenCache && _marketplaceTokenCache.expiresAt > now + 5 * 60 * 1000) {
    return _marketplaceTokenCache.token;
  }

  if (!env.marketplaceClientId || !env.marketplaceClientSecret) {
    throw new Error(
      '[BankVerify] ISW_MARKETPLACE_CLIENT_ID and ISW_MARKETPLACE_CLIENT_SECRET are not set. ' +
      'Add them to your .env.local file.'
    );
  }

  // Same Base64 approach as the payments token —
  // clientId:clientSecret → Base64 → Authorization: Basic <encoded>
  const credentials = Buffer.from(
    `${env.marketplaceClientId}:${env.marketplaceClientSecret}`
  ).toString('base64');

  const res = await fetch(
    `${env.marketplacePassportUrl}/passport/oauth/token?grant_type=client_credentials`,
    {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[BankVerify] Token fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('[BankVerify] No access_token in marketplace token response');
  }

  _marketplaceTokenCache = {
    token:     data.access_token,
    expiresAt: now + ((data.expires_in ?? 3600) - 300) * 1000,
  };

  return _marketplaceTokenCache.token;
}

// ── GET bank list ─────────────────────────────────────────────────
// Returns all active Nigerian banks with their codes.
// Cache this in the DB or in-memory — it rarely changes.

let _bankListCache: { data: BankListItem[]; cachedAt: number } | null = null;
const BANK_LIST_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getBankList(): Promise<BankListItem[]> {
  // Return from memory cache if fresh
  if (_bankListCache && Date.now() - _bankListCache.cachedAt < BANK_LIST_TTL_MS) {
    return _bankListCache.data;
  }

  const token = await getMarketplaceToken();

  const res = await fetch(
    `${env.marketplaceBaseUrl}/verify/identity/account-number/bank-list`,
    {
      method:  'GET',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[BankVerify] Bank list fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(`[BankVerify] Bank list error: ${data.message ?? 'Unknown error'}`);
  }

  // Filter active Nigerian banks only
  const banks: BankListItem[] = (data.data ?? [])
    .filter((b: BankListItem) => b.active && b.country === 'Nigeria')
    .sort((a: BankListItem, b: BankListItem) => a.name.localeCompare(b.name));

  _bankListCache = { data: banks, cachedAt: Date.now() };

  return banks;
}

// ── POST resolve account ──────────────────────────────────────────
// Verifies that the account number belongs to the given bank
// and returns the account holder name from the bank's records.
// This is the source of truth — we use the returned name, not user input.

export async function resolveAccount(
  accountNumber: string,
  bankCode: string
): Promise<ResolveAccountResult> {
  if (!accountNumber || accountNumber.length !== 10 || !/^\d{10}$/.test(accountNumber)) {
    throw Object.assign(
      new Error('Account number must be exactly 10 digits'),
      { status: 400 }
    );
  }

  if (!bankCode?.trim()) {
    throw Object.assign(new Error('Bank code is required'), { status: 400 });
  }

  const token = await getMarketplaceToken();

  const res = await fetch(
    `${env.marketplaceBaseUrl}/verify/identity/account-number/resolve`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber: accountNumber.trim(),
        bankCode:      bankCode.trim(),
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    // 404 typically means account not found
    if (res.status === 404) {
      throw Object.assign(
        new Error('Account number not found. Please check your details.'),
        { status: 404 }
      );
    }
    throw new Error(`[BankVerify] Resolve failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (!data.success || data.data?.status !== 'found') {
    throw Object.assign(
      new Error('Could not verify this account. Please check your bank and account number.'),
      { status: 400 }
    );
  }

  const bankDetails = data.data?.bankDetails;

  if (!bankDetails?.accountName) {
    throw Object.assign(
      new Error('Account verification returned no account name. Please try again.'),
      { status: 400 }
    );
  }

  // Find bank name from the resolve response or fall back to our list
  const banks = await getBankList().catch(() => [] as BankListItem[]);
  const bank  = banks.find((b) => b.code === bankCode);

  return {
    accountName:   bankDetails.accountName,    // e.g. "MICHAEL JOHN DOE"
    accountNumber: bankDetails.accountNumber,
    bankName:      bankDetails.bankName ?? bank?.name ?? bankCode,
    bankCode,
    verified:      true,
  };
}