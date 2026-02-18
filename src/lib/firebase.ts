/**
 * Firebase client SDK – analytics and FCM (web push).
 * Config from env: NEXT_PUBLIC_FIREBASE_* (see .env.local.example).
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0] as FirebaseApp;
    return app;
  }
  app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAnalytics(): Analytics | null {
  if (typeof window === 'undefined') return null;
  try {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;
    if (analytics) return analytics;
    analytics = getAnalytics(firebaseApp);
    return analytics;
  } catch {
    return null;
  }
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Request notification permission, get FCM token, and register it with the backend.
 * Call when user is logged in (e.g. from dashboard layout).
 * Uses dynamic import so Firebase Messaging is only loaded in the browser.
 */
export async function registerFCMToken(userId: string): Promise<boolean> {
  console.log('[FCM Client] registerFCMToken called:', { userId, hasWindow: typeof window !== 'undefined', hasVapidKey: !!VAPID_KEY });
  
  if (typeof window === 'undefined' || !userId) {
    console.warn('[FCM Client] Cannot register - no window or userId');
    return false;
  }
  
  try {
    // Register service worker first
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM Client] Service worker registered:', registration.scope);
      } catch (swError) {
        console.warn('[FCM Client] Service worker registration failed:', swError);
      }
    }
    
    console.log('[FCM Client] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[FCM Client] Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.warn('[FCM Client] Notification permission not granted:', permission);
      return false;
    }
    
    console.log('[FCM Client] Loading Firebase Messaging...');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const firebaseApp = getFirebaseApp();
    
    if (!firebaseApp) {
      console.error('[FCM Client] Firebase app not initialized');
      return false;
    }
    
    console.log('[FCM Client] Getting messaging instance...');
    const msg = getMessaging(firebaseApp);
    
    // Wait for service worker to be ready
    let serviceWorkerRegistration = null;
    if ('serviceWorker' in navigator) {
      serviceWorkerRegistration = await navigator.serviceWorker.ready;
      console.log('[FCM Client] Service worker ready');
    }
    
    console.log('[FCM Client] Getting FCM token with VAPID key...');
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY || undefined,
      serviceWorkerRegistration: serviceWorkerRegistration || undefined,
    });
    
    if (!token) {
      console.warn('[FCM Client] No token received');
      return false;
    }
    
    console.log('[FCM Client] Token received:', token.substring(0, 20) + '...');
    
    // Register foreground message handler
    onMessage(msg, (payload) => {
      console.log('[FCM Client] Foreground message received:', payload);
      const locale = localStorage.getItem('locale') || 'en';
      const d = payload.data || {};
      const n = payload.notification || {};
      const title = locale === 'ar' ? (d.title_ar || n.title) : (d.title_en || n.title);
      const body = locale === 'ar' ? (d.body_ar || n.body) : (d.body_en || n.body);
      
      if (title && body && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon',
          badge: '/icon',
        });
      }
    });
    
    console.log('[FCM Client] Registering token with backend...');
    const res = await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });
    const data = await res.json();
    console.log('[FCM Client] Registration response:', data);
    return data && data.success === true;
  } catch (e) {
    console.error('[FCM Client] Registration failed:', e);
    return false;
  }
}
