'use client';

// Polls for new notifications every 30 seconds when the tab is active.
import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'payment' | 'job' | 'system';
  read: boolean;
  createdAt: string;
}

export function useNotifications(pollIntervalMs = 30_000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const intervalRef                       = useRef<NodeJS.Timeout | null>(null);

  const fetch_ = useCallback(async () => {
    const res  = await fetch('/api/notifications');
    const data = await res.json();
    if (data.success) {
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch_();

    // Poll only when tab is visible
    function startPolling() {
      intervalRef.current = setInterval(() => {
        if (!document.hidden) fetch_();
      }, pollIntervalMs);
    }

    startPolling();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) fetch_(); // immediate refresh on tab focus
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch_, pollIntervalMs]);

  const markRead = useCallback(async (ids?: string[]) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    await fetch_();
  }, [fetch_]);

  return { notifications, unreadCount, loading, refresh: fetch_, markRead };
}