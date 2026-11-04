'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Loader2, Music, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase-config';
import { doc, serverTimestamp, updateDoc } from '@/lib/backend/firestore';
import { useMyWedding } from '@/lib/use-my-wedding';
import type { SongSuggestion } from '@/types/wedding';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `song_${Date.now()}`;
}

export default function MusicPage() {
  const { wedding, loading, reload } = useMyWedding();
  const { toast } = useToast();
  const [songs, setSongs] = useState<SongSuggestion[]>([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSongs(wedding?.songs || []);
  }, [wedding]);

  const persist = async (next: SongSuggestion[], note: string) => {
    if (!wedding?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'weddings', wedding.id), { songs: next, updatedAt: serverTimestamp() });
      setSongs(next);
      await reload();
      toast({ title: note });
    } catch (error) {
      toast({ title: 'Could not save playlist', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addSong = () => {
    if (!title.trim()) {
      toast({ title: 'Add a title', variant: 'destructive' });
      return;
    }
    void persist(
      [...songs, { id: newId(), title: title.trim(), artist: artist.trim() || undefined, votes: 0 }],
      'Song added',
    );
    setTitle('');
    setArtist('');
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!wedding) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <CardTitle className="mb-2">No Wedding Site Yet</CardTitle>
        <CardDescription className="mb-6">Create your wedding site before building a playlist.</CardDescription>
        <Button asChild><Link href="/dashboard/details"><PlusCircle className="mr-2 h-4 w-4" />Create Your Wedding Site</Link></Button>
      </Card>
    );
  }

  const ordered = songs.slice().sort((a, b) => (b.votes || 0) - (a.votes || 0));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Music className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Playlist</h1>
          <p className="text-muted-foreground mt-1">Guests can suggest songs and vote on the public website. This does not play music.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Songs</CardTitle>
          <CardDescription>Seed the list yourself, then share the website so guests can vote.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ordered.length === 0 && <p className="text-sm text-muted-foreground">No songs yet.</p>}
          <ul className="space-y-2">
            {ordered.map((song) => (
              <li key={song.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[song.artist, song.suggestedBy ? `suggested by ${song.suggestedBy}` : ''].filter(Boolean).join(' · ') || 'No artist'}
                    {' · '}{song.votes || 0} votes
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove song" disabled={saving} onClick={() => persist(songs.filter((entry) => entry.id !== song.id), 'Song removed')}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input placeholder="Song title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Input placeholder="Artist (optional)" value={artist} onChange={(event) => setArtist(event.target.value)} />
            <Button type="button" onClick={addSong} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
