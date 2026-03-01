/**
 * Firebase client SDK – analytics and FCM (web push).
 * Config from env: NEXT_PUBLIC_FIREBASE_* (see .env.local.example).
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { fetchApi } from '@/lib/fetchApi';

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

let notificationAudioContext: AudioContext | null = null;
let pendingBeep = false;
let backgroundBeepSetup = false;

/** Unlock audio on user gesture (call after permission grant or first click). */
function unlockNotificationAudio() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = notificationAudioContext ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!notificationAudioContext) notificationAudioContext = ctx;
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    // Ignore
  }
}

/** Play a short beep. Unlock first with unlockNotificationAudio() after user gesture. */
function playNotificationSound() {
  if (typeof window === 'undefined') return;
  const ctx = notificationAudioContext ?? new (window.AudioContext || (window as any).webkitAudioContext)();
  if (!notificationAudioContext) notificationAudioContext = ctx;
  const play = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  };
  if (ctx.state === 'suspended') {
    ctx.resume().then(play).catch(() => {});
  } else {
    play();
  }
}

/** Listen for background notification and play beep when user returns to tab or opens from notification click. */
function setupBackgroundBeep() {
  if (typeof window === 'undefined' || backgroundBeepSetup) return;
  backgroundBeepSetup = true;
  if (typeof window !== 'undefined' && window.location.search.includes('fromNotification=1')) {
    unlockNotificationAudio();
    setTimeout(() => playNotificationSound(), 100);
  }
  navigator.serviceWorker?.addEventListener('message', (e) => {
    if (e.data?.type === 'PENDING_BEEP') pendingBeep = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pendingBeep) {
      pendingBeep = false;
      playNotificationSound();
    }
  });
}

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
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        setupBackgroundBeep();
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

    unlockNotificationAudio();
    
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
    
    if (!backgroundBeepSetup) setupBackgroundBeep();
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
    
    // Unlock beep on first click (in case permission was granted in a prior session)
    const once = () => unlockNotificationAudio();
    document.addEventListener('click', once, { once: true, capture: true });
    document.addEventListener('keydown', once, { once: true, capture: true });

    // Register foreground message handler
    onMessage(msg, (payload) => {
      console.log('[FCM Client] Foreground message received:', payload);
      const locale = localStorage.getItem('locale') || 'en';
      const d = payload.data || {};
      const n = payload.notification || {};
      const title = locale === 'ar' ? (d.title_ar || n.title) : (d.title_en || n.title);
      const body = locale === 'ar' ? (d.body_ar || n.body) : (d.body_en || n.body);
      
      if (title && body && 'Notification' in window && Notification.permission === 'granted') {
        playNotificationSound();
        new Notification(title, {
          body,
          icon: '/icon.png',
          badge: '/icon.png',
          silent: false,
          vibrate: [200, 100, 200],
        });
      }
    });
    
    console.log('[FCM Client] Registering token with backend...');
    const res = await fetchApi('/api/fcm/register', {
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
