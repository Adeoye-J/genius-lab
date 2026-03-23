// Centralised environment variable access.
// Throws at startup if required vars are missing — fail fast, not silently.

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

// Only validate on server side
export const env = {
  // MongoDB
  mongodbUri: requireEnv('MONGODB_URI'),

  // Session
  sessionSecret: requireEnv('SESSION_SECRET'),
  sessionMaxAge: parseInt(optionalEnv('SESSION_MAX_AGE', '604800'), 10), // 7 days

  // App
  appUrl: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',
  isProd: optionalEnv('NODE_ENV', 'development') === 'production',

  // Interswitch (optional for now, won't throw)
  interswitchClientId:     optionalEnv('INTERSWITCH_CLIENT_ID'),
  interswitchClientSecret: optionalEnv('INTERSWITCH_CLIENT_SECRET'),
  interswitchBaseUrl:      optionalEnv('INTERSWITCH_BASE_URL', 'https://sandbox.interswitchng.com'),
} as const;