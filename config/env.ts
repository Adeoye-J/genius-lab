// config/env.ts
// Centralised environment variable access with startup validation.

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `[StreetCred] Missing required environment variable: ${key}\n` +
      `Check your .env.local file. See .env.example for reference.`
    );
  }
  return val;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // MongoDB
  mongodbUri: requireEnv('MONGODB_URI'),

  // Session
  sessionSecret:  requireEnv('SESSION_SECRET'),
  sessionMaxAge:  parseInt(optionalEnv('SESSION_MAX_AGE', '604800'), 10), // 7 days

  // App
  appUrl:  optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDev:   optionalEnv('NODE_ENV', 'development') === 'development',
  isProd:  optionalEnv('NODE_ENV', 'development') === 'production',

  // ── Interswitch ────────────────────────────────────────────────
  // clientId and clientSecret are used to generate the access token
  interswitchClientId:     optionalEnv('INTERSWITCH_CLIENT_ID'),
  interswitchClientSecret: optionalEnv('INTERSWITCH_CLIENT_SECRET'),

  // merchantCode and payItemId come from your Quickteller Business Dashboard
  // merchantCode  = the MX-prefixed code e.g. "MX18722"
  // payItemId     = pay_item_id / payable_code from your profile
  interswitchMerchantCode: optionalEnv('INTERSWITCH_MERCHANT_CODE'),
  interswitchPayItemId:    optionalEnv('INTERSWITCH_PAY_ITEM_ID'),

  // Base URL for collections/verify API calls
  // QA:   https://qa.interswitchng.com
  // Live: https://webpay.interswitchng.com
  interswitchBaseUrl: optionalEnv('INTERSWITCH_BASE_URL', 'https://qa.interswitchng.com'),

  // Passport URL for token generation
  // QA:   https://qa.interswitchng.com
  // Live: https://passport.interswitchng.com
  interswitchPassportUrl: optionalEnv('INTERSWITCH_PASSPORT_URL', 'https://qa.interswitchng.com'),

  // Termii SMS
  termiiApiKey:  optionalEnv('TERMII_API_KEY'),
  termiiSenderId: optionalEnv('TERMII_SENDER_ID', 'StreetCred'),
} as const;