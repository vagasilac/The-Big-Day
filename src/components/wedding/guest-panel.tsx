'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, ListMusic, Users } from 'lucide-react';
import { db } from '@/lib/firebase-config';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from '@/lib/backend/firestore';
import type { Wedding, SongSuggestion } from '@/types/wedding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface GuestPanelProps {
  wedding: Partial<Wedding>;
  /** Marketing preview inside the homepage sheet. */
  isPreviewMode?: boolean;
  /** The /weddings/sample page. Responses are not stored. */
  sample?: boolean;
}

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}`;
}

export default function GuestPanel({ wedding, isPreviewMode, sample }: GuestPanelProps) {
  const searchParams = useSearchParams();
  const [songs, setSongs] = useState<SongSuggestion[]>(wedding.songs || []);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [suggestedBy, setSuggestedBy] = useState('');
  const [guestId, setGuestId] = useState(searchParams.get('guest') || '');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [status, setStatus] = useState<'accepted' | 'declined' | 'maybe'>('accepted');
  const [meal, setMeal] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const locked = isPreviewMode || sample || !wedding.id || wedding.id === 'sample';
  const registry = wedding.registry || [];

  const votedKey = useMemo(() => `the-big-day-votes-${wedding.id || 'none'}`, [wedding.id]);

  const alreadyVoted = (songId: string) => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(votedKey);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      return list.includes(songId);
    } catch {
      return false;
    }
  };

  const rememberVote = (songId: string) => {
    const raw = window.localStorage.getItem(votedKey);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(songId)) {
      window.localStorage.setItem(votedKey, JSON.stringify([...list, songId]));
    }
  };

  const saveSongs = async (next: SongSuggestion[]) => {
    if (!wedding.id || locked) return;
    await updateDoc(doc(db, 'weddings', wedding.id), {
      songs: next,
      updatedAt: serverTimestamp(),
    });
  };

  const addSong = async () => {
    setError('');
    if (!title.trim()) {
      setError('Add a song title first.');
      return;
    }
    if (locked) {
      setError(sample ? 'This is a sample site. Suggestions are not saved.' : 'Suggestions open on the published wedding site.');
      return;
    }
    const song: SongSuggestion = {
      id: newId(),
      title: title.trim(),
      artist: artist.trim() || undefined,
      suggestedBy: suggestedBy.trim() || undefined,
      votes: 1,
    };
    const next = [...songs, song];
    setBusy(true);
    try {
      await saveSongs(next);
      setSongs(next);
      rememberVote(song.id);
      setTitle('');
      setArtist('');
      setSuggestedBy('');
      setMessage('Song added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that song.');
    } finally {
      setBusy(false);
    }
  };

  const vote = async (songId: string) => {
    setError('');
    if (locked) return;
    if (alreadyVoted(songId)) {
      setError('You already voted for that song in this browser.');
      return;
    }
    const next = songs.map((song) => (song.id === songId ? { ...song, votes: (song.votes || 0) + 1 } : song));
    setBusy(true);
    try {
      await saveSongs(next);
      setSongs(next);
      rememberVote(songId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that vote.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('guest');
    if (!id || !wedding.id || locked) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'weddings', wedding.id as string, 'guests', id));
        const data = snap.data();
        if (cancelled || !snap.exists() || !data) return;
        setGuestId(snap.id);
        setGuestName(String(data.name || ''));
        setGuestEmail(String(data.email || ''));
        if (data.mealChoice) setMeal(String(data.mealChoice));
        if (data.rsvpStatus === 'accepted' || data.rsvpStatus === 'declined' || data.rsvpStatus === 'maybe') {
          setStatus(data.rsvpStatus);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not open this invitation.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, wedding.id, locked]);

  const notifyRsvp = async (email: string, name: string) => {
    if (!email) return;
    try {
      await fetch('/api/send-rsvp-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          status,
          weddingTitle: wedding.title || 'the wedding',
        }),
      });
    } catch {
      // The RSVP is already saved. Mail is best-effort.
    }
  };

  const submitRsvp = async () => {
    setError('');
    if (locked || !wedding.id) {
      setError(sample ? 'Sample site: this form is not saved.' : 'RSVP opens on the published site.');
      return;
    }
    const name = guestName.trim();
    if (!name) {
      setError('Add your name so the couple knows who replied.');
      return;
    }
    setBusy(true);
    try {
      let savedGuestId = guestId;
      if (!savedGuestId) {
        try {
          const snap = await getDocs(collection(db, 'weddings', wedding.id, 'guests'));
          const match = snap.docs.find((entry) => String(entry.data().name || '').trim().toLowerCase() === name.toLowerCase());
          if (match) savedGuestId = match.id;
        } catch {
          // The public guest list is private. A name-only reply is stored as a response.
        }
      }

      if (savedGuestId) {
        await updateDoc(doc(db, 'weddings', wedding.id, 'guests', savedGuestId), {
          rsvpStatus: status,
          mealChoice: meal.trim() || null,
          updatedAt: serverTimestamp(),
        });
        setGuestId(savedGuestId);
      } else {
        const responseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || newId();
        await setDoc(doc(db, 'weddings', wedding.id, 'responses', responseId), {
          name,
          rsvpStatus: status,
          mealChoice: meal.trim() || null,
          email: guestEmail.trim() || null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      await notifyRsvp(guestEmail.trim(), name);
      setMessage(`RSVP saved for ${name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the RSVP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="rsvp" className="py-12 md:py-16 bg-background border-t border-border">
      <div className="container mx-auto px-4 max-w-3xl space-y-8">
        {registry.length > 0 && (
          <div>
            <h2 className="text-3xl text-center mb-6 flex items-center justify-center gap-2">
              <Gift className="h-6 w-6 text-primary" /> Gift registry
            </h2>
            <ul className="space-y-3">
              {registry.map((item) => (
                <li key={item.id} className="rounded-lg border bg-card p-4">
                  <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                    {item.name}
                  </a>
                  {item.note && <p className="text-sm text-muted-foreground mt-1">{item.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-3xl text-center mb-2 flex items-center justify-center gap-2">
            <ListMusic className="h-6 w-6 text-primary" /> Playlist
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-4">
            Suggest a song or vote for one. Votes are counted once per browser.
          </p>
          {songs.length === 0 && <p className="text-center text-muted-foreground text-sm mb-4">No songs yet.</p>}
          <ul className="space-y-2 mb-4">
            {songs
              .slice()
              .sort((a, b) => (b.votes || 0) - (a.votes || 0))
              .map((song) => (
                <li key={song.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[song.artist, song.suggestedBy ? `from ${song.suggestedBy}` : ''].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" disabled={busy || locked} onClick={() => vote(song.id)}>
                    {song.votes || 0} votes
                  </Button>
                </li>
              ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Song title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Input placeholder="Artist (optional)" value={artist} onChange={(event) => setArtist(event.target.value)} />
            <Input placeholder="Your name (optional)" value={suggestedBy} onChange={(event) => setSuggestedBy(event.target.value)} />
          </div>
          <Button type="button" className="mt-2" variant="secondary" disabled={busy} onClick={addSong}>
            Suggest song
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-6">
          <h2 className="text-3xl text-center mb-2 flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-primary" /> RSVP
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-4">
            Your invitation link is enough. No account and no code. The couple sees your answer with the guest list.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Your name"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              autoComplete="name"
            />
            <Input
              placeholder="Email for a confirmation (optional)"
              type="email"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              autoComplete="email"
            />
            <div className="flex flex-wrap gap-2">
              {(['accepted', 'declined', 'maybe'] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={status === option ? 'default' : 'outline'}
                  onClick={() => setStatus(option)}
                >
                  {option === 'accepted' ? 'Joyfully accept' : option === 'declined' ? 'Decline' : 'Maybe'}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Meal choice or dietary note (optional)"
              value={meal}
              onChange={(event) => setMeal(event.target.value)}
            />
            <Button type="button" disabled={busy || !guestName.trim()} onClick={submitRsvp}>
              Send RSVP
            </Button>
          </div>
        </div>

        {message && <p className="text-center text-sm text-foreground">{message}</p>}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {locked && (
          <p className="text-center text-xs text-muted-foreground">
            {sample
              ? 'Sample website. Names, the date, and the venue are placeholders, and nothing you type here is saved.'
              : 'This preview does not save guest responses.'}
          </p>
        )}
      </div>
    </section>
  );
}
