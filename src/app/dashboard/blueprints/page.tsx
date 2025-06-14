"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { VenueBlueprint } from '@/types/blueprint';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BlueprintListPage() {
  const [blueprints, setBlueprints] = useState<VenueBlueprint[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const q = query(collection(db, 'venueBlueprints'), where('ownerId', '==', userId));
      const snap = await getDocs(q);
      const result: VenueBlueprint[] = [];
      snap.forEach(doc => {
        const data = doc.data() as VenueBlueprint;
        result.push({ ...data, id: doc.id });
      });
      setBlueprints(result);
    };
    fetchData();
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Venue Blueprints</h1>
        <Button asChild><Link href="/dashboard/blueprints/new">New Blueprint</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {blueprints.map(bp => (
          <Card key={bp.id} className="shadow">
            <CardHeader>
              <CardTitle>{bp.name}</CardTitle>
              <CardDescription>Max Capacity: {bp.maxCapacity}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Unit: {bp.unit}</p>
            </CardContent>
          </Card>
        ))}
        {blueprints.length === 0 && <p>No blueprints yet.</p>}
      </div>
    </div>
  );
}

