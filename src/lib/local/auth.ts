import { loadStore, newId, notifyStore, persistStore, subscribeStore } from './shared';

export interface LocalAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const authListeners = new Set<(user: LocalAuthUser | null) => void>();

function toUser(record: { uid: string; email: string; displayName?: string | null } | undefined): LocalAuthUser | null {
  if (!record) return null;
  return {
    uid: record.uid,
    email: record.email,
    displayName: record.displayName ?? null,
    photoURL: null,
  };
}

export function currentUser(): LocalAuthUser | null {
  if (typeof window === 'undefined') return null;
  const store = loadStore();
  if (!store.sessionUid) return null;
  return toUser(store.users[store.sessionUid]);
}

function emitAuth() {
  const user = currentUser();
  authListeners.forEach((listener) => listener(user));
}

export function onAuthStateChanged(_auth: unknown, callback: (user: LocalAuthUser | null) => void) {
  authListeners.add(callback);
  callback(currentUser());
  const unsubscribeStore = typeof window === 'undefined'
    ? () => undefined
    : subscribeStore(() => callback(currentUser()));
  return () => {
    authListeners.delete(callback);
    unsubscribeStore();
  };
}

function authError(code: string, message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

export async function signInWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  const store = loadStore();
  const record = Object.values(store.users).find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (!record || record.password !== password) {
    throw authError('auth/invalid-credential', 'Invalid email or password.');
  }
  store.sessionUid = record.uid;
  persistStore();
  emitAuth();
  notifyStore();
  return { user: toUser(record) };
}

export async function createUserWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  const store = loadStore();
  const existing = Object.values(store.users).find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) throw authError('auth/email-already-in-use', 'This email address is already registered.');
  if (password.length < 6) throw authError('auth/weak-password', 'The password is too weak.');
  const uid = newId();
  store.users[uid] = { uid, email: email.trim(), password, displayName: null };
  store.sessionUid = uid;
  persistStore();
  emitAuth();
  notifyStore();
  return { user: toUser(store.users[uid]) };
}

export async function signOut(_auth?: unknown) {
  const store = loadStore();
  store.sessionUid = null;
  persistStore();
  emitAuth();
  notifyStore();
}

export async function setLocalPassword(email: string, password: string) {
  const store = loadStore();
  const record = Object.values(store.users).find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (!record) throw authError('auth/user-not-found', 'No account with that email is stored in this browser.');
  if (password.length < 6) throw authError('auth/weak-password', 'The password is too weak.');
  record.password = password;
  persistStore();
  notifyStore();
}
