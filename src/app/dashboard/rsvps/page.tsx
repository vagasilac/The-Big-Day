'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ListChecks, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-config';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from '@/lib/backend/firestore';
import { useMyWedding } from '@/lib/use-my-wedding';
import type { Guest } from '@/types/guest';

const STATUSES = ['pending', 'accepted', 'declined', 'maybe'] as const;

export default function RsvpsPage() {
  const { wedding, loading } = useMyWedding();
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);

  const loadGuests = useCallback(async (weddingId: string) => {
    setLoadingGuests(true);
    try {
      const snap = await getDocs(collection(db, 'weddings', weddingId, 'guests'));
      setGuests(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Guest));
    } catch (error) {
      toast({ title: 'Could not load RSVPs', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setLoadingGuests(false);
    }
  }, [toast]);

  useEffect(() => {
    if (wedding?.id) void loadGuests(wedding.id);
  }, [wedding?.id, loadGuests]);

  const setStatus = async (guest: Guest, rsvpStatus: Guest['rsvpStatus']) => {
    if (!wedding?.id || !guest.id) return;
    try {
      await updateDoc(doc(db, 'weddings', wedding.id, 'guests', guest.id), {
        rsvpStatus,
        updatedAt: serverTimestamp(),
      });
      setGuests((current) => current.map((item) => (item.id === guest.id ? { ...item, rsvpStatus } : item)));
    } catch (error) {
      toast({ title: 'Could not update RSVP', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!wedding) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <CardTitle className="mb-2">No Wedding Site Yet</CardTitle>
        <CardDescription className="mb-6">Create your wedding site, then add guests.</CardDescription>
        <Button asChild><Link href="/dashboard/details"><PlusCircle className="mr-2 h-4 w-4" />Create Your Wedding Site</Link></Button>
      </Card>
    );
  }

  const count = (status: string) => guests.filter((guest) => (guest.rsvpStatus || 'pending') === status).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ListChecks className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">RSVPs</h1>
          <p className="text-muted-foreground mt-1">Answers from the public site land here. You can also set a status yourself.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUSES.map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2"><CardDescription className="capitalize">{status}</CardDescription></CardHeader>
            <CardContent><p className="text-3xl font-bold">{count(status)}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest responses</CardTitle>
          <CardDescription>
            {loadingGuests ? 'Loading…' : `${guests.length} guests. Add people under Guest Management, and put an invitation code on each one.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {guests.length === 0 && !loadingGuests && (
            <Button asChild variant="outline"><Link href="/dashboard/guests">Add guests</Link></Button>
          )}
          {guests.map((guest) => (
            <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border rounded-lg p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{guest.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[guest.email, guest.mealChoice ? `Meal: ${guest.mealChoice}` : '', guest.invitationCode ? `Code: ${guest.invitationCode}` : 'No invitation code']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                value={guest.rsvpStatus || 'pending'}
                onChange={(event) => setStatus(guest, event.target.value as Guest['rsvpStatus'])}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
