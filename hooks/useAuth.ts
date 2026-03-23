'use client';

// Client-side auth hook. Fetches current user on mount, exposes login/logout helpers.
// Use this in any Client Component that needs to know who's logged in.

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/types';

interface UseAuthReturn {
  user: SessionUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser]       = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data?.data?.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE' });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  return { user, loading, logout, refresh };
}