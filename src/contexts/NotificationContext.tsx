'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '@/types';
import { mockNotifications } from '@/lib/mockData';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (userId) {
      // Load notifications for user from localStorage or mock data
      const stored = localStorage.getItem(`notifications-${userId}`);
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {
          // Fallback to mock data
          const userNotifications = mockNotifications.filter(n => n.userId === userId);
          setNotifications(userNotifications);
        }
      } else {
        const userNotifications = mockNotifications.filter(n => n.userId === userId);
        setNotifications(userNotifications);
        localStorage.setItem(`notifications-${userId}`, JSON.stringify(userNotifications));
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId && notifications.length > 0) {
      localStorage.setItem(`notifications-${userId}`, JSON.stringify(notifications));
    }
  }, [notifications, userId]);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
