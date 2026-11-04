'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ImageIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-config';
import { doc, serverTimestamp, updateDoc } from '@/lib/backend/firestore';
import { useMyWedding } from '@/lib/use-my-wedding';
import { uploadImage } from '@/lib/upload-image';
import { SafeImage } from '@/components/safe-image';
import type { WeddingPhoto } from '@/types/wedding';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `photo_${Date.now()}`;
}

export default function GalleryPage() {
  const { wedding, loading, reload } = useMyWedding();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const saveGallery = async (gallery: WeddingPhoto[]) => {
    if (!wedding?.id) return;
    await updateDoc(doc(db, 'weddings', wedding.id), { gallery, updatedAt: serverTimestamp() });
    await reload();
  };

  const addByUrl = async () => {
    if (!wedding?.id) return;
    if (!url.trim().startsWith('http')) {
      toast({ title: 'Need a link', description: 'Paste an image link that starts with http, or upload a file.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const gallery = [...(wedding.gallery || []), { id: newId(), url: url.trim(), description: description.trim() || undefined }];
      await saveGallery(gallery);
      setUrl('');
      setDescription('');
      toast({ title: 'Photo added' });
    } catch (error) {
      toast({ title: 'Could not save', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const addFile = async (file: File | undefined) => {
    if (!file || !wedding?.id) return;
    setBusy(true);
    try {
      const stored = await uploadImage(`gallery/${wedding.userId}/${wedding.id}/${Date.now()}-${file.name}`, file);
      const gallery = [...(wedding.gallery || []), { id: newId(), url: stored, description: description.trim() || undefined }];
      await saveGallery(gallery);
      setDescription('');
      toast({ title: 'Photo uploaded' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Try a smaller image.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (id: string) => {
    if (!wedding) return;
    setBusy(true);
    try {
      await saveGallery((wedding.gallery || []).filter((photo) => photo.id !== id));
      toast({ title: 'Photo removed' });
    } catch (error) {
      toast({ title: 'Could not remove photo', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <Card className="border-dashed border-2 p-8 text-center shadow-sm">
        <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
        <CardDescription className="mb-6">Create your wedding site before adding photos.</CardDescription>
        <Button asChild>
          <Link href="/dashboard/details"><PlusCircle className="mr-2 h-4 w-4" />Create Your Wedding Site</Link>
        </Button>
      </Card>
    );
  }

  const photos = wedding.gallery || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ImageIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Photo Gallery</h1>
          <p className="text-muted-foreground mt-1">Photos here show on your public wedding website.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a photo</CardTitle>
          <CardDescription>Upload a picture from this phone, or paste a public image link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Caption (optional)" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Input placeholder="https:// image link" value={url} onChange={(event) => setUrl(event.target.value)} />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" onClick={addByUrl} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add link
            </Button>
            <Input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                void addFile(file);
                event.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <p className="text-muted-foreground">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="rounded-lg border overflow-hidden bg-card">
              <div className="relative aspect-square bg-muted">
                <SafeImage src={photo.url} alt={photo.description || 'Gallery photo'} fill className="object-cover" />
              </div>
              <div className="p-2 flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground line-clamp-2">{photo.description || 'No caption'}</p>
                <Button type="button" size="icon" variant="ghost" onClick={() => removePhoto(photo.id)} disabled={busy} aria-label="Remove photo">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
