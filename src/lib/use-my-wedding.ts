'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-config';
import { onAuthStateChanged, type User } from '@/lib/backend/auth';
import { collection, getDocs, query, where } from '@/lib/backend/firestore';
import { db } from '@/lib/firebase-config';
import type { Wedding } from '@/types/wedding';

export function useMyWedding() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string) => {
    const snap = await getDocs(query(collection(db, 'weddings'), where('userId', '==', uid)));
    if (snap.empty) {
      setWedding(null);
      return null;
    }
    const first = snap.docs[0];
    const next = { id: first.id, ...first.data() } as Wedding;
    setWedding(next);
    return next;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setWedding(null);
        setLoading(false);
        router.push('/auth');
        return;
      }
      setUser(nextUser);
      try {
        await load(nextUser.uid);
      } catch (error) {
        console.error('Error loading wedding', error);
        setWedding(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, load]);

  const reload = useCallback(async () => {
    if (!user) return null;
    return load(user.uid);
  }, [user, load]);

  return { user, wedding, setWedding, loading, reload };
}
