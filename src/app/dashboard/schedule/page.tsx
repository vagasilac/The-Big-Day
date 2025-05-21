
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, PlusCircle, CalendarDays } from 'lucide-react';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';

export default function SchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            <CardContent>
              <p className="text-muted-foreground">
                Event schedule management features will be available here soon.
              </p>
              <div className="mt-6 p-6 bg-secondary rounded-md text-center">
                <p className="font-medium text-secondary-foreground">Timeline features coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
