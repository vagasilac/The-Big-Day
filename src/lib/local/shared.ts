import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_UID } from '@/lib/demo-account';

export const STORAGE_KEY = 'the-big-day-local-v1';
const TS_KEY = '__ts';

export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6));
  }

  toMillis(): number {
    return this.toDate().getTime();
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(Math.floor(date.getTime() / 1000), (date.getTime() % 1000) * 1e6);
  }

  static now(): Timestamp {
    return Timestamp.fromDate(new Date());
  }
}

export function serverTimestampSentinel() {
  return { _methodName: 'serverTimestamp' as const };
}

export interface LocalUserRecord {
  uid: string;
  email: string;
  password: string;
  displayName?: string | null;
}

export interface LocalStore {
  docs: Record<string, unknown>;
  users: Record<string, LocalUserRecord>;
  sessionUid: string | null;
  files: Record<string, string>;
}

const emptyStore = (): LocalStore => ({
  docs: {},
  users: {},
  sessionUid: null,
  files: {},
});

let cache: LocalStore | null = null;
const listeners = new Set<() => void>();

function ensureDemo(store: LocalStore) {
  if (!store.users[DEMO_UID]) {
    store.users[DEMO_UID] = {
      uid: DEMO_UID,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: 'Preview account',
    };
  }
}

export function loadStore(): LocalStore {
  if (cache) return cache;
  if (typeof window === 'undefined') {
    return emptyStore();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as LocalStore) : emptyStore();
  } catch {
    cache = emptyStore();
  }
  if (!cache.docs) cache.docs = {};
  if (!cache.users) cache.users = {};
  if (!cache.files) cache.files = {};
  ensureDemo(cache);
  persistStore();
  return cache;
}

export function persistStore() {
  if (typeof window === 'undefined' || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    throw new Error('This browser is out of storage space. Remove a photo or use a smaller image.');
  }
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyStore() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      cache = event.newValue ? (JSON.parse(event.newValue) as LocalStore) : emptyStore();
    } catch {
      cache = emptyStore();
    }
    notifyStore();
  });
}

export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

export function resolveSentinels(value: unknown): unknown {
  if (value instanceof Timestamp) return value;
  if (value && typeof value === 'object' && (value as { _methodName?: string })._methodName === 'serverTimestamp') {
    return Timestamp.now();
  }
  if (Array.isArray(value)) return value.map((item) => resolveSentinels(item));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      out[key] = resolveSentinels(entry);
    }
    return out;
  }
  return value;
}

export function serialize(value: unknown): unknown {
  if (value instanceof Timestamp) return { [TS_KEY]: value.toDate().toISOString() };
  if (Array.isArray(value)) return value.map((item) => serialize(item));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serialize(entry);
    }
    return out;
  }
  return value;
}

export function deserialize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => deserialize(item));
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record[TS_KEY] === 'string' && Object.keys(record).length === 1) {
      return Timestamp.fromDate(new Date(record[TS_KEY] as string));
    }
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) {
      out[key] = deserialize(entry);
    }
    return out;
  }
  return value;
}

export function comparable(value: unknown): string | number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.toLowerCase();
  if (value == null) return '';
  return String(value);
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
