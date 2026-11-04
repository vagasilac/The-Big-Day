import { db } from '@/lib/firebase-config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';

function toIso(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return value;
    }
  }
  return value;
}

/** Server-side read for Firebase mode. Public read must be allowed in firestore.rules. */
export async function getWeddingBySlug(slug: string): Promise<Partial<Wedding> | null> {
  const snap = await getDocs(query(collection(db, 'weddings'), where('slug', '==', slug)));
  if (snap.empty) return null;
  const first = snap.docs[0];
  const data = first.data();
  return {
    id: first.id,
    ...data,
    date: toIso(data.date) as Wedding['date'],
    rsvpDeadline: toIso(data.rsvpDeadline) as Wedding['rsvpDeadline'],
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    schedule: Array.isArray(data.schedule) ? data.schedule : [],
    registry: Array.isArray(data.registry) ? data.registry : [],
    songs: Array.isArray(data.songs) ? data.songs : [],
  } as Partial<Wedding>;
}
