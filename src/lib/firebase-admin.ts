import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'the-big-day-31aox';

function adminApp(): App {
  if (getApps().length) return getApps()[0];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return initializeApp({
      credential: cert(JSON.parse(json) as Record<string, string>),
      projectId: PROJECT_ID,
    });
  }
  return initializeApp({ projectId: PROJECT_ID });
}

export function adminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

export function adminDb() {
  return getFirestore(adminApp());
}

export async function uidFromAuthHeader(header: string | null): Promise<string | null> {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
