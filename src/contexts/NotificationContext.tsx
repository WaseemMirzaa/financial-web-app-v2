'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Notification as AppNotification } from '@/types';
import { reloadIfStaleDeploy } from '@/lib/client-utils';
import { fetchApi } from '@/lib/fetchApi';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  /** Call after user gesture to request notification permission (for background/system notifications) */
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_SOUND_PATH = '/notification-beep.wav';
const NOTIFICATION_OWNER_KEY = 'notifications-poller-owner-v1';
const NOTIFICATION_DATA_KEY = 'notifications-latest-v1';
const OWNER_STALE_MS = 60000;

export function NotificationProvider({ children, userId, locale }: { children: ReactNode; userId?: string; locale?: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const tabIdRef = React.useRef<string | null>(null);
  const prevUnreadIdsRef = React.useRef<Set<string>>(new Set());
  const audioUnlockedRef = React.useRef<boolean>(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const notificationAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const permissionRequestedRef = React.useRef<boolean>(false);
  const mountedRef = React.useRef<boolean>(true);
  const initialFetchDoneRef = React.useRef<boolean>(false);
  const isFetchingRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  React.useEffect(() => {
    initialFetchDoneRef.current = false;
    prevUnreadIdsRef.current = new Set();
  }, [userId]);

  // Generate stable tab id
  if (typeof window !== 'undefined' && !tabIdRef.current) {
    tabIdRef.current = `tab-${Math.random().toString(36).slice(2)}`;
  }

  const tryClaimOwnership = useCallback(() => {
    if (typeof window === 'undefined' || !tabIdRef.current) return;
    try {
      const now = Date.now();
      const raw = window.localStorage.getItem(NOTIFICATION_OWNER_KEY);
      let current: { ownerId: string; ts: number } | null = null;
      if (raw) {
        try {
          current = JSON.parse(raw);
        } catch {
          current = null;
        }
      }
      const isStale = !current || now - current.ts > OWNER_STALE_MS;
      if (!current || isStale || current.ownerId === tabIdRef.current) {
        const next = { ownerId: tabIdRef.current, ts: now };
        window.localStorage.setItem(NOTIFICATION_OWNER_KEY, JSON.stringify(next));
        setIsOwner(true);
      } else {
        setIsOwner(current.ownerId === tabIdRef.current);
      }
    } catch {
      // ignore lock errors
    }
  }, []);

  // Ownership & cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    tryClaimOwnership();

    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_OWNER_KEY && event.newValue && tabIdRef.current) {
        try {
          const parsed = JSON.parse(event.newValue);
          setIsOwner(parsed.ownerId === tabIdRef.current);
        } catch {
          // ignore
        }
      }
      if (event.key === NOTIFICATION_DATA_KEY && event.newValue && !isOwner) {
        try {
          const parsed = JSON.parse(event.newValue) as AppNotification[];
          if (mountedRef.current && Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tryClaimOwnership();
      }
    };

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isOwner, tryClaimOwnership]);

  // Owner heartbeat so other tabs can detect stale owners
  useEffect(() => {
    if (typeof window === 'undefined' || !isOwner || !tabIdRef.current) return;
    const interval = window.setInterval(() => {
      try {
        const now = Date.now();
        const payload = { ownerId: tabIdRef.current, ts: now };
        window.localStorage.setItem(NOTIFICATION_OWNER_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }, OWNER_STALE_MS / 2);
    return () => window.clearInterval(interval);
  }, [isOwner]);

  // Unlock audio and request notification permission on first user interaction (browser requirement)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlockAudioAndPermission = () => {
      try {
        if (audioUnlockedRef.current) return;
        // 2. Unlock AudioContext
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        // 3. Create and "unlock" one Audio element by playing it once (then pause) so future plays work
        const audio = new Audio(NOTIFICATION_SOUND_PATH);
        audio.volume = 0.5;
        notificationAudioRef.current = audio;
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
        audioUnlockedRef.current = true;
      } catch (e) {
        console.warn('Failed to unlock audio:', e);
      }
    };
    document.addEventListener('click', unlockAudioAndPermission, { once: true });
    document.addEventListener('keydown', unlockAudioAndPermission, { once: true });
    return () => {
      document.removeEventListener('click', unlockAudioAndPermission);
      document.removeEventListener('keydown', unlockAudioAndPermission);
    };
  }, []);

  const playBeepSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = audioContextRef.current;
      if (ctx && ctx.destination) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        return;
      }
      const audio = notificationAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } else {
        try {
          const fallback = new Audio(NOTIFICATION_SOUND_PATH);
          fallback.volume = 0.5;
          fallback.play().catch(() => {});
        } catch {
          // no audio file or not allowed
        }
      }
    } catch {
      // ignore any beep errors to avoid affecting app stability
    }
  }, []);

  const showSystemNotification = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window) || window.Notification.permission !== 'granted') return;
    try {
      const n = new window.Notification(title, { body });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      setTimeout(() => n.close(), 8000);
    } catch (e) {
      console.warn('Failed to show system notification:', e);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (mountedRef.current) setLoading(true);
      const params = new URLSearchParams({ userId });
      if (locale) params.set('locale', locale);
      const response = await fetchApi(`/api/notifications?${params.toString()}`);
      const data = await response.json();
      if (!mountedRef.current) return;
      if (data.success && Array.isArray(data.data)) {
        const newNotifications = data.data as AppNotification[];
        const newUnreadIds = new Set(
          newNotifications
            .filter((n: AppNotification) => !n.isRead)
            .map((n: AppNotification) => n.id)
        );
        const prevUnreadIds = prevUnreadIdsRef.current;
        const isInitialFetch = !initialFetchDoneRef.current;
        initialFetchDoneRef.current = true;

        // Only beep for unreads that appeared after we started (skip on first fetch / re-login / navigate back)
        const hasNewUnreadSinceLastFetch = Array.from(newUnreadIds).some(id => !prevUnreadIds.has(id));

        if (hasNewUnreadSinceLastFetch && !isInitialFetch) {
          const latestNew = newNotifications.find((n: AppNotification) => !n.isRead && !prevUnreadIds.has(n.id));
          if (latestNew && typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            try {
              showSystemNotification(
                latestNew.title || 'Notification',
                latestNew.message || ''
              );
            } catch {
              // ignore
            }
          }
          setTimeout(() => {
            if (mountedRef.current) playBeepSound();
          }, 100);
        }

        prevUnreadIdsRef.current = newUnreadIds;
        setNotifications(newNotifications);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(NOTIFICATION_DATA_KEY, JSON.stringify(newNotifications));
          } catch {
            // ignore storage errors
          }
        }
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      if (mountedRef.current) console.error('Failed to fetch notifications:', error);
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [userId, locale, playBeepSound, showSystemNotification]);

  // Initial load: only owner hits API; others hydrate from localStorage
  useEffect(() => {
    if (!userId) return;
    if (isOwner) {
      fetchNotifications();
    } else if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(NOTIFICATION_DATA_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppNotification[];
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [userId, isOwner, fetchNotifications]);

  // On focus, only owner refreshes from API
  useEffect(() => {
    if (!userId || !isOwner) return;
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId, isOwner, fetchNotifications]);

  // Realtime: poll every 30s from owner tab only
  useEffect(() => {
    if (!userId || !isOwner) return;
    const interval = setInterval(() => fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [userId, isOwner, fetchNotifications]);

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt'>) => {
    try {
      const response = await fetchApi('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notification,
          userId: userId || notification.userId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to add notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetchApi(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n => markAsRead(n.id))
      );
    } catch (error) {
      reloadIfStaleDeploy(error);
      console.error('Failed to mark all as read:', error);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    if (window.Notification.permission !== 'default') return window.Notification.permission;
    permissionRequestedRef.current = true;
    return window.Notification.requestPermission();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        refreshNotifications: fetchNotifications,
        requestNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
