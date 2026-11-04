'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Heart, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-config';
import { doc, serverTimestamp, updateDoc } from '@/lib/backend/firestore';
import { useMyWedding } from '@/lib/use-my-wedding';
import type { RegistryLink } from '@/types/wedding';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `reg_${Date.now()}`;
}

export default function RegistryPage() {
  const { wedding, loading, reload } = useMyWedding();
  const { toast } = useToast();
  const [items, setItems] = useState<RegistryLink[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(wedding?.registry || []);
  }, [wedding]);

  const update = (id: string, field: keyof RegistryLink, value: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const save = async () => {
    if (!wedding?.id) return;
    if (items.some((item) => !item.name.trim() || !item.url.trim())) {
      toast({ title: 'Missing fields', description: 'Each link needs a name and a URL.', variant: 'destructive' });
      return;
    }
    if (items.some((item) => !/^https?:\/\//i.test(item.url.trim()))) {
      toast({ title: 'Link must start with http', description: 'Use the full address of the registry page.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'weddings', wedding.id), {
        registry: items.map((item) => ({
          id: item.id,
          name: item.name.trim(),
          url: item.url.trim(),
          note: item.note?.trim() || '',
        })),
        updatedAt: serverTimestamp(),
      });
      await reload();
      toast({ title: 'Registry saved' });
    } catch (error) {
      toast({ title: 'Could not save', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!wedding) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <CardTitle className="mb-2">No Wedding Site Yet</CardTitle>
        <CardDescription className="mb-6">Create your wedding site before adding registry links.</CardDescription>
        <Button asChild><Link href="/dashboard/details"><PlusCircle className="mr-2 h-4 w-4" />Create Your Wedding Site</Link></Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Gift className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Gift Registry</h1>
          <p className="text-muted-foreground mt-1">Links you add here appear on the public wedding website. This app does not take payments.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registry links</CardTitle>
          <CardDescription>Point guests at a store, a honeymoon fund, or any page you already use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 && <p className="text-sm text-muted-foreground">No links yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] border rounded-lg p-3">
              <Input placeholder="Name, for example a store" value={item.name} onChange={(event) => update(item.id, 'name', event.target.value)} />
              <Input placeholder="https://" value={item.url} onChange={(event) => update(item.id, 'url', event.target.value)} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove link" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Input className="sm:col-span-3" placeholder="Note for guests (optional)" value={item.note || ''} onChange={(event) => update(item.id, 'note', event.target.value)} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, { id: newId(), name: '', url: '', note: '' }])}>
              <PlusCircle className="mr-2 h-4 w-4" />Add link
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save registry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
