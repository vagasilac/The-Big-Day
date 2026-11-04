import { isLocalMode } from '@/lib/data-mode';
import * as local from '@/lib/local/auth';
import {
  createUserWithEmailAndPassword as remoteCreate,
  onAuthStateChanged as remoteOnAuth,
  sendPasswordResetEmail as remoteReset,
  signInWithEmailAndPassword as remoteSignIn,
  signOut as remoteSignOut,
} from 'firebase/auth';

export type { User } from 'firebase/auth';
export { setLocalPassword } from '@/lib/local/auth';

export const onAuthStateChanged = ((...args: never[]) =>
  (isLocalMode() ? local.onAuthStateChanged : remoteOnAuth)(...args)) as typeof remoteOnAuth;

export const signInWithEmailAndPassword = ((...args: never[]) =>
  (isLocalMode() ? local.signInWithEmailAndPassword : remoteSignIn)(...args)) as typeof remoteSignIn;

export const createUserWithEmailAndPassword = ((...args: never[]) =>
  (isLocalMode() ? local.createUserWithEmailAndPassword : remoteCreate)(...args)) as typeof remoteCreate;

export const signOut = ((...args: never[]) =>
  (isLocalMode() ? local.signOut : remoteSignOut)(...args)) as typeof remoteSignOut;

export async function sendPasswordResetEmail(auth: Parameters<typeof remoteReset>[0], email: string) {
  if (isLocalMode()) {
    const error = new Error('This preview keeps accounts in the browser and cannot send email. Set a new password below.') as Error & { code: string };
    error.code = 'auth/local-no-email';
    throw error;
  }
  return remoteReset(auth, email);
}
