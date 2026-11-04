'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Loader2, Mail, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-config';
import { Timestamp, collection, doc, getDocs, serverTimestamp, updateDoc } from '@/lib/backend/firestore';
import { useMyWedding } from '@/lib/use-my-wedding';
import type { Guest } from '@/types/guest';
import type { Wedding } from '@/types/wedding';

function invitationCode() {
  return Math.random().toString(36).slice(2, 8);
}

function weddingLink(wedding: Wedding, guest: Guest) {
  const params = new URLSearchParams();
  if (guest.id) params.set('guest', guest.id);
  if (guest.invitationCode) params.set('code', guest.invitationCode);
  const query = params.toString();
  return `${window.location.origin}/weddings/${wedding.slug}${query ? `?${query}` : ''}`;
}

function dateIso(wedding: Wedding) {
  if (!wedding.date) return '';
  if (wedding.date instanceof Timestamp) return wedding.date.toDate().toISOString();
  if (typeof wedding.date === 'string') return wedding.date;
  return '';
}

export default function InvitationsPage() {
  const { wedding, loading } = useMyWedding();
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadGuests = useCallback(async (weddingId: string) => {
    const snap = await getDocs(collection(db, 'weddings', weddingId, 'guests'));
    setGuests(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as Guest));
  }, []);

  useEffect(() => {
    if (wedding?.id) {
      loadGuests(wedding.id).catch((error) => {
        toast({ title: 'Could not load guests', description: error instanceof Error ? error.message : '', variant: 'destructive' });
      });
    }
  }, [wedding?.id, loadGuests, toast]);

  const ensureCode = async (guest: Guest) => {
    if (!wedding?.id || !guest.id) return guest;
    if (guest.invitationCode) return guest;
    const code = invitationCode();
    await updateDoc(doc(db, 'weddings', wedding.id, 'guests', guest.id), {
      invitationCode: code,
      updatedAt: serverTimestamp(),
    });
    const next = { ...guest, invitationCode: code };
    setGuests((current) => current.map((item) => (item.id === guest.id ? next : item)));
    return next;
  };

  const payloadFor = (guest: Guest, preview: boolean) => ({
    email: guest.email,
    link: weddingLink(wedding as Wedding, guest),
    preview,
    guestDetails: {
      name: guest.name,
      plusOneAllowed: guest.plusOneAllowed,
      plusOneName: guest.plusOneName,
      headOfFamily: guest.headOfFamily,
      personalMessage: guest.personalMessage,
    },
    weddingDetails: {
      title: wedding?.title,
      dateISO: wedding ? dateIso(wedding) : '',
      location: wedding?.location || 'To be announced',
    },
  });

  const preview = async (guest: Guest) => {
    if (!guest.email) {
      toast({ title: 'Add an email first', description: 'Open Guest Management and save an email address.', variant: 'destructive' });
      return;
    }
    setBusyId(guest.id || 'preview');
    try {
      const ready = await ensureCode(guest);
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(ready, true)),
      });
      const data = await response.json();
      if (!response.ok || !data.html) throw new Error(data.error || 'Could not build the preview.');
      setPreviewHtml(data.html);
      setPreviewOpen(true);
    } catch (error) {
      toast({ title: 'Preview failed', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (guest: Guest) => {
    if (!wedding) return;
    try {
      const ready = await ensureCode(guest);
      await navigator.clipboard.writeText(weddingLink(wedding, ready));
      toast({ title: 'Link copied', description: 'Send it by text, chat, or email.' });
    } catch (error) {
      toast({ title: 'Could not copy', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    }
  };

  const sendEmail = async (guest: Guest) => {
    if (!wedding?.id || !guest.id || !guest.email) return;
    setBusyId(guest.id);
    try {
      const ready = await ensureCode(guest);
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(ready, false)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Email was not sent.');
      await updateDoc(doc(db, 'weddings', wedding.id, 'guests', guest.id), {
        invitationStatus: 'sent',
        updatedAt: serverTimestamp(),
      });
      setGuests((current) => current.map((item) => (item.id === guest.id ? { ...item, invitationStatus: 'sent', invitationCode: ready.invitationCode } : item)));
      toast({ title: 'Invitation sent', description: guest.email });
    } catch (error) {
      toast({ title: 'Email not sent', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!wedding) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <CardTitle className="mb-2">No Wedding Site Yet</CardTitle>
        <CardDescription className="mb-6">Create your wedding site before inviting guests.</CardDescription>
        <Button asChild><Link href="/dashboard/details"><PlusCircle className="mr-2 h-4 w-4" />Create Your Wedding Site</Link></Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Digital Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Copy a personal link, or send email when SMTP is configured. Without SMTP, sending is unavailable and the preview still works.
          </p>
        </div>
      </div>

      {!wedding.slug && (
        <p className="text-sm text-destructive">Set a website address under Wedding Details before sharing links.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Guests</CardTitle>
          <CardDescription>Each link includes an invitation code so that guest can RSVP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {guests.length === 0 && (
            <Button asChild variant="outline"><Link href="/dashboard/guests">Add guests</Link></Button>
          )}
          {guests.map((guest) => (
            <div key={guest.id} className="border rounded-lg p-3 space-y-2">
              <div>
                <p className="font-medium">{guest.name}</p>
                <p className="text-xs text-muted-foreground">
                  {guest.email || 'No email'} · {guest.invitationStatus === 'sent' ? 'Marked as sent' : 'Not marked as sent'}
                  {guest.invitationCode ? ` · Code ${guest.invitationCode}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={!guest.email || busyId === guest.id} onClick={() => preview(guest)}>
                  {busyId === guest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Preview'}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={!wedding.slug} onClick={() => copyLink(guest)}>
                  Copy link
                </Button>
                <Button type="button" size="sm" disabled={!guest.email || !wedding.slug || busyId === guest.id} onClick={() => sendEmail(guest)}>
                  Send email
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invitation preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden bg-white" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
