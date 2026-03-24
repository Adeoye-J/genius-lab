'use client';
// store/authStore.ts
// Lightweight React-context auth store — no Zustand/Redux needed at this scale.
// Wrap your app in <AuthProvider> once; consume with useAuthStore() anywhere.

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { SessionUser } from '@/types';

interface AuthState {
  user:    SessionUser | null;
  loading: boolean;
  setUser: (u: SessionUser | null) => void;
  logout:  () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser_]    = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: SessionUser | null) => setUser_(u), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/me');
      const data = await res.json();
      setUser_(data.success ? data.data.user : null);
    } catch {
      setUser_(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setUser_(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used inside <AuthProvider>');
  return ctx;
}