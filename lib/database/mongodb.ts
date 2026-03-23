// Singleton pattern for MongoDB connection.
// Next.js dev mode re-runs module code on every hot reload.
// Without caching the promise, it'll spin up a new connection on every reload.

import mongoose from 'mongoose';
import { env } from '@/config/env';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Attach to global so it persists across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  // Already connected — return immediately
  if (cache.conn) {
    return cache.conn;
  }

  // Connection in progress — wait for it
  if (!cache.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Fail fast if not connected — don't queue operations
      maxPoolSize: 10,       // Max 10 concurrent connections per serverless instance
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cache.promise = mongoose
      .connect(env.mongodbUri, opts)
      .then((mg) => {
        console.log('[MongoDB] Connected successfully');
        return mg;
      })
      .catch((err) => {
        cache.promise = null; // Reset so next call retries
        console.error('[MongoDB] Connection failed:', err.message);
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

// Helper for API routes — wraps handler with DB connection
// Usage: export default withDB(async (req, res) => { ... })
export function withDB<T>(
  handler: () => Promise<T>
): Promise<T> {
  return connectDB().then(() => handler());
}