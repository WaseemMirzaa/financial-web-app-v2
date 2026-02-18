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
  if (typeof window === 'undefined' || !userId) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    const { getMessaging, getToken } = await import('firebase/messaging');
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return false;
    const msg = getMessaging(firebaseApp);
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY || undefined,
    });
    if (!token) return false;
    const res = await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });
    const data = await res.json();
    return data?.success === true;
  } catch (e) {
    console.warn('FCM registration failed', e);
    return false;
  }
}
