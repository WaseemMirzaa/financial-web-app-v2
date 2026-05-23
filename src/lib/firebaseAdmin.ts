/**
 * Firebase Admin SDK — server-only FCM push.
 * Initializes on import / instrumentation with env-based service account credentials.
 */

import fs from 'fs';
import path from 'path';

type ServiceAccountLike = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let adminModule: any = null;
let initAttempted = false;
let initOk = false;
let initError: string | null = null;

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, '\n');
  if (!key.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) key = decoded;
    } catch {
      // keep original
    }
  }
  return key;
}

function parseServiceAccountJson(raw: string): ServiceAccountLike | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const tryParse = (text: string): ServiceAccountLike | null => {
    try {
      const json = JSON.parse(text) as Record<string, string>;
      const projectId = json.project_id || json.projectId;
      const clientEmail = json.client_email || json.clientEmail;
      const privateKey = json.private_key || json.privateKey;
      if (!projectId || !clientEmail || !privateKey) return null;
      return {
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
      };
    } catch {
      return null;
    }
  };

  return (
    tryParse(trimmed) ||
    tryParse(Buffer.from(trimmed, 'base64').toString('utf8'))
  );
}

function readServiceAccountFile(filePath: string): ServiceAccountLike | null {
  try {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      console.warn('[FCM Admin] Credentials file not found:', resolved);
      return null;
    }
    const raw = fs.readFileSync(resolved, 'utf8');
    return parseServiceAccountJson(raw);
  } catch (err) {
    console.warn('[FCM Admin] Failed to read credentials file:', err);
    return null;
  }
}

function findServiceAccountFileInCwd(): ServiceAccountLike | null {
  try {
    const files = fs.readdirSync(process.cwd());
    const match = files.find(
      (f) => f.startsWith('firebase-adminsdk') && f.endsWith('.json')
    );
    if (!match) return null;
    console.log('[FCM Admin] Using service account file:', match);
    return readServiceAccountFile(match);
  } catch {
    return null;
  }
}

function resolveServiceAccount(): ServiceAccountLike | null {
  const jsonEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (jsonEnv) {
    const parsed = parseServiceAccountJson(jsonEnv);
    if (parsed) {
      console.log('[FCM Admin] Using service account from env JSON');
      return parsed;
    }
    console.warn('[FCM Admin] FIREBASE_SERVICE_ACCOUNT* env set but JSON parse failed');
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || '';

  if (projectId && clientEmail && privateKeyRaw) {
    console.log('[FCM Admin] Using FIREBASE_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY');
    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKeyRaw),
    };
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && !credPath.trim().startsWith('{')) {
    const fromFile = readServiceAccountFile(credPath);
    if (fromFile) {
      console.log('[FCM Admin] Using GOOGLE_APPLICATION_CREDENTIALS file');
      return fromFile;
    }
  }

  const fromCwd = findServiceAccountFileInCwd();
  if (fromCwd) return fromCwd;

  return null;
}

export function isFirebaseAdminReady(): boolean {
  return initOk && !!adminModule?.apps?.length;
}

export function getFirebaseAdmin(): any {
  if (!initAttempted) initFirebaseAdmin();
  return initOk ? adminModule : null;
}

/** Call at server startup; safe to call multiple times. */
export function initFirebaseAdmin(): boolean {
  if (initAttempted) return initOk;
  initAttempted = true;

  if (typeof window !== 'undefined') {
    initError = 'Firebase Admin is server-only';
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- server-only optional dep
    const admin = require('firebase-admin');
    adminModule = admin;

    if (admin.apps?.length) {
      initOk = true;
      console.log('[FCM Admin] Already initialized');
      return true;
    }

    const serviceAccount = resolveServiceAccount();
    if (!serviceAccount) {
      initError =
        'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (or GOOGLE_APPLICATION_CREDENTIALS path to service account JSON). NEXT_PUBLIC_FIREBASE_* alone is not enough for server push.';
      console.error('[FCM Admin]', initError);
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
    });

    initOk = true;
    initError = null;
    console.log('[FCM Admin] Initialized for project:', serviceAccount.projectId);
    return true;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    console.error('[FCM Admin] Initialize failed:', err);
    return false;
  }
}

export function getFirebaseAdminInitError(): string | null {
  return initError;
}

if (typeof window === 'undefined') {
  initFirebaseAdmin();
}
