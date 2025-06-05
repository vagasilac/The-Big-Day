
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, ListChecks, PlusCircle, Eye, Edit, Heart, Loader2, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast'; // Import useToast

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, Timestamp, doc, onSnapshot } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { Guest } from '@/types/guest';


// Simple countdown logic
const CountdownTimer = ({ targetDateISO }: { targetDateISO: string | null | undefined }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    if (!targetDateISO) {
      setTimeLeft('Date not set');
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDateISO) - +new Date();
      let newTimeLeft = '';

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        newTimeLeft = `${days}d ${hours}h ${minutes}m`;
      } else {
        newTimeLeft = 'The big day is here or has passed!';
      }
      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDateISO]);

  return <div className="text-3xl font-bold text-foreground">{timeLeft}</div>;
};


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [totalGuestCount, setTotalGuestCount] = useState(0);
  const [rsvpsReceivedCount, setRsvpsReceivedCount] = useState(0);
  const [brideGuestCount, setBrideGuestCount] = useState(0);
  const [groomGuestCount, setGroomGuestCount] = useState(0);
  const [sharedGuestCount, setSharedGuestCount] = useState(0);
  const [serviceGuestCount, setServiceGuestCount] = useState(0);
  const [otherCategoryGuestCount, setOtherCategoryGuestCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchWeddingAndGuestData = useCallback(async (user: User) => {
    setIsLoading(true);
    setIsLoadingStats(true);
    try {
      const weddingsRef = collection(db, 'weddings');
      const qWedding = query(weddingsRef, where('userId', '==', user.uid));
      const weddingQuerySnapshot = await getDocs(qWedding);

      if (!weddingQuerySnapshot.empty) {
        const weddingDoc = weddingQuerySnapshot.docs[0];
        const currentWeddingData = { id: weddingDoc.id, ...weddingDoc.data() } as Wedding;
        setWeddingData(currentWeddingData);

        if (currentWeddingData.id) {
          const guestsRef = collection(db, 'weddings', currentWeddingData.id, 'guests');
          const unsubscribeGuests = onSnapshot(guestsRef, (guestSnapshot) => {
            const guestsList: Guest[] = [];
            let localBrideCount = 0;
            let localGroomCount = 0;
            let localSharedCount = 0;
            let localServiceCount = 0;
            let localOtherCount = 0;

            guestSnapshot.forEach((doc) => {
              const guest = { id: doc.id, ...doc.data() } as Guest;
              guestsList.push(guest);
              switch (guest.category) {
                case "bride's":
                  localBrideCount++;
                  break;
                case "bridegroom's":
                  localGroomCount++;
                  break;
                case 'shared':
                  localSharedCount++;
                  break;
                case 'service':
                  localServiceCount++;
                  break;
                default:
                  localOtherCount++;
              }
            });
            
            setTotalGuestCount(guestsList.length);
            const respondedCount = guestsList.filter(g => g.rsvpStatus === 'accepted' || g.rsvpStatus === 'declined').length;
            setRsvpsReceivedCount(respondedCount);
            
            setBrideGuestCount(localBrideCount);
            setGroomGuestCount(localGroomCount);
            setSharedGuestCount(localSharedCount);
            setServiceGuestCount(localServiceCount);
            setOtherCategoryGuestCount(localOtherCount);

            setIsLoadingStats(false);
          }, (error) => {
            console.error("Error fetching guest stats:", error);
            toast({ title: "Error loading guest stats", description: error.message, variant: "destructive" });
            setIsLoadingStats(false);
          });
          return unsubscribeGuests;
        } else {
          setIsLoadingStats(false);
        }
      } else {
        setWeddingData(null);
        setBrideGuestCount(0);
        setGroomGuestCount(0);
        setSharedGuestCount(0);
        setServiceGuestCount(0);
        setOtherCategoryGuestCount(0);
        setIsLoadingStats(false);
      }
    } catch (error: any) {
      console.error("Error fetching wedding data:", error);
      toast({ title: "Error loading wedding data", description: error.message, variant: "destructive" });
      setWeddingData(null);
      setIsLoadingStats(false);
    } finally {
      setIsLoading(false);
    }
    return () => {};
  }, [toast]);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      let unsubscribeGuests = () => {};
      if (user) {
        setCurrentUser(user);
        unsubscribeGuests = await fetchWeddingAndGuestData(user) || (() => {});
      } else {
        setCurrentUser(null);
        setWeddingData(null);
        router.push('/auth');
        setIsLoading(false);
        setIsLoadingStats(false);
      }
      return () => {
        unsubscribeAuth();
        if (unsubscribeGuests) {
          unsubscribeGuests();
        }
      };
    });
    return () => unsubscribeAuth();
  }, [router, fetchWeddingAndGuestData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
           <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-72" />
            </div>
          </div>
        </div>
        <Card className="shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
            <Skeleton className="relative aspect-[4/3] md:aspect-auto h-full w-full" />
            <div className="p-6 flex flex-col justify-between">
              <div>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2 mb-3" />
                <Skeleton className="h-4 w-1/3 mb-4" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-1" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                Manage your wedding planning all in one place.
                </p>
            </div>
        </div>
        {!weddingData && (
           <Button asChild className="mt-4 sm:mt-0">
            <Link href="/dashboard/details">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Wedding Site
            </Link>
          </Button>
        )}
      </div>

      {weddingData ? (
        <>
          <Card className="shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
              <div className="relative aspect-[4/3] md:aspect-auto bg-secondary">
                <Image
                  src={weddingData.coverPhoto || 'https://placehold.co/600x400.png'}
                  alt={weddingData.title || 'Wedding cover photo'}
                  fill
                  className="object-cover"
                  data-ai-hint={weddingData.coverPhoto ? "wedding couple" : "placeholder image"}
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <CardTitle className="text-2xl lg:text-3xl mb-1">{weddingData.title}</CardTitle>
                  <CardDescription className="text-base mb-3">
                    {weddingData.date && weddingData.date instanceof Timestamp
                      ? weddingData.date.toDate().toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Date to be announced'}
                  </CardDescription>
                  {weddingData.location && (
                    <p className="text-sm text-muted-foreground mb-4">
                      At {weddingData.location}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <Button variant="outline" asChild>
                    <Link href={weddingData.slug ? `/weddings/${weddingData.slug}` : '#'}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Site
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/dashboard/details`}> 
                      <Edit className="mr-2 h-4 w-4" />
                      Manage Wedding
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Countdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CountdownTimer targetDateISO={weddingData.date instanceof Timestamp ? weddingData.date.toDate().toISOString() : null} />
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Total Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-3xl font-bold text-foreground">{totalGuestCount}</div>}
                <p className="text-xs text-muted-foreground">individuals invited</p>
                {!isLoadingStats && totalGuestCount > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                    <span>Bride: {brideGuestCount}</span>
                    <span className="hidden sm:inline">|</span>
                    <span>Groom: {groomGuestCount}</span>
                    <span className="hidden sm:inline">|</span>
                    <span>Shared: {sharedGuestCount}</span>
                    {serviceGuestCount > 0 && (
                      <>
                        <span className="hidden sm:inline">|</span>
                        <span>Service: {serviceGuestCount}</span>
                      </>
                    )}
                     {otherCategoryGuestCount > 0 && (
                      <>
                        <span className="hidden sm:inline">|</span>
                        <span>Other: {otherCategoryGuestCount}</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <ListChecks className="mr-2 h-4 w-4" />
                  RSVPs Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                 {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-3xl font-bold text-foreground">{rsvpsReceivedCount}</div> }
                 <p className="text-xs text-muted-foreground">responded</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="border-dashed border-2 p-8 text-center shadow-sm">
           <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
            It looks like you haven&apos;t created your wedding site. Get started to manage all your details!
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/details">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your Wedding Site
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}

