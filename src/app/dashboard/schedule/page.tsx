
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  PlusCircle,
  CalendarDays,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  Plus
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Wedding, WeddingEvent } from '@/types/wedding';

export default function SchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<WeddingEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const updateEventField = (index: number, field: keyof WeddingEvent, value: string) => {
    setSchedule(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const moveEventUp = (index: number) => {
    if (index === 0) return;
    setSchedule(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveEventDown = (index: number) => {
    setSchedule(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const addEvent = () => {
    setSchedule(prev => [...prev, { time: '', event: '', description: '' }]);
  };

  const handleDelete = (index: number) => {
    setSchedule(prev => prev.filter((_, i) => i !== index));
    setDeleteIndex(null);
  };

  const saveSchedule = async () => {
    if (!weddingData?.id) return;
    if (schedule.some(e => !e.time || !e.event)) {
      toast({ title: 'Missing fields', description: 'Each event requires time and name.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'weddings', weddingData.id), {
        schedule,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Schedule saved' });
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast({ title: 'Error', description: error.message || 'Could not save schedule.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const weddingsRef = collection(db, 'weddings');
          const q = query(weddingsRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const weddingDoc = querySnapshot.docs[0];
            setWeddingData({ id: weddingDoc.id, ...weddingDoc.data() } as Wedding);
          } else {
            setWeddingData(null);
          }
        } catch (error) {
          console.error("Error fetching wedding data:", error);
          setWeddingData(null);
        }
      } else {
        setCurrentUser(null);
        setWeddingData(null);
        router.push('/auth');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (weddingData && Array.isArray(weddingData.schedule)) {
      setSchedule(weddingData.schedule);
    } else {
      setSchedule([]);
    }
  }, [weddingData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
                <Skeleton className="h-10 w-48 mb-2" />
                <Skeleton className="h-5 w-72" />
            </div>
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {!weddingData ? (
        <Card className="border-dashed border-2 p-8 text-center shadow-sm">
          <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please create your wedding site first to manage the event schedule.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/details">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your Wedding Site
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-3">
             <CalendarDays className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Event Schedule</h1>
                <p className="text-muted-foreground mt-1">
                Plan and display the timeline of your wedding day.
                </p>
            </div>
          </div>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Wedding Day Timeline</CardTitle>
              <CardDescription>
                Organize the events for your special day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.length === 0 && (
                <p className="text-muted-foreground">No events added yet.</p>
              )}
              {schedule.map((item, index) => (
                <div key={index} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-col md:flex-row gap-2 w-full">
                    <Input
                      type="time"
                      value={item.time}
                      onChange={e => updateEventField(index, 'time', e.target.value)}
                      className="md:w-32"
                    />
                    <Input
                      placeholder="Event"
                      value={item.event}
                      onChange={e => updateEventField(index, 'event', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={item.description || ''}
                    onChange={e => updateEventField(index, 'description', e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => moveEventUp(index)}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === schedule.length - 1}
                      onClick={() => moveEventDown(index)}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <AlertDialog onOpenChange={open => { if (!open) setDeleteIndex(null); }}>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteIndex(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      {deleteIndex === index && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this event?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(index)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                  </div>
                </div>
              ))}

              <Button variant="outline" type="button" onClick={addEvent} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
              <div className="flex justify-end">
                <Button onClick={saveSchedule} disabled={isSaving} className="mt-2">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
