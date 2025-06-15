
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, ListChecks, PlusCircle, Eye, Edit, Heart, Loader2, LayoutDashboard, GanttChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { plannerTasks } from '@/lib/planner-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [totalGuestCount, setTotalGuestCount] = useState(0);
  const [rsvpsReceivedCount, setRsvpsReceivedCount] = useState(0);
  const [totalMarkedAsInvitedCount, setTotalMarkedAsInvitedCount] = useState(0);
  
  const [brideGuestCount, setBrideGuestCount] = useState(0);
  const [groomGuestCount, setGroomGuestCount] = useState(0);
  const [sharedGuestCount, setSharedGuestCount] = useState(0);
  const [serviceGuestCount, setServiceGuestCount] = useState(0);
  const [otherCategoryGuestCount, setOtherCategoryGuestCount] = useState(0);

  const [totalAcceptedCount, setTotalAcceptedCount] = useState(0);
  const [totalDeclinedCount, setTotalDeclinedCount] = useState(0);
  const [acceptedBrideGuestCount, setAcceptedBrideGuestCount] = useState(0);
  const [acceptedGroomGuestCount, setAcceptedGroomGuestCount] = useState(0);
  const [acceptedSharedGuestCount, setAcceptedSharedGuestCount] = useState(0);
  const [acceptedServiceGuestCount, setAcceptedServiceGuestCount] = useState(0);
  const [acceptedOtherGuestCount, setAcceptedOtherGuestCount] = useState(0);
  const [declinedBrideGuestCount, setDeclinedBrideGuestCount] = useState(0);
  const [declinedGroomGuestCount, setDeclinedGroomGuestCount] = useState(0);
  const [declinedSharedGuestCount, setDeclinedSharedGuestCount] = useState(0);
  const [declinedServiceGuestCount, setDeclinedServiceGuestCount] = useState(0);
  const [declinedOtherGuestCount, setDeclinedOtherGuestCount] = useState(0);

  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [plannerCompleted, setPlannerCompleted] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const stored = localStorage.getItem('planner-completed');
    if (stored) {
      try { setPlannerCompleted(JSON.parse(stored)); } catch (_) {}
    }
  }, []);
  const plannerProgress = Math.round((Object.keys(plannerCompleted).filter(k => plannerCompleted[k]).length / plannerTasks.length) * 100);

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
            let localMarkedAsInvited = 0;
            
            let localTotalAccepted = 0;
            let localTotalDeclined = 0;
            let localAcceptedBride = 0, localAcceptedGroom = 0, localAcceptedShared = 0, localAcceptedService = 0, localAcceptedOther = 0;
            let localDeclinedBride = 0, localDeclinedGroom = 0, localDeclinedShared = 0, localDeclinedService = 0, localDeclinedOther = 0;


            guestSnapshot.forEach((doc) => {
              const guest = { id: doc.id, ...doc.data() } as Guest;
              guestsList.push(guest);

              if (guest.invitationStatus === 'sent') {
                localMarkedAsInvited++;
              }

              // Total guests by category
              switch (guest.category) {
                case "bride's": localBrideCount++; break;
                case "bridegroom's": localGroomCount++; break;
                case 'shared': localSharedCount++; break;
                case 'service': localServiceCount++; break;
                // 'other' will be calculated later
              }

              // RSVPs by category
              if (guest.rsvpStatus === 'accepted') {
                localTotalAccepted++;
                switch (guest.category) {
                  case "bride's": localAcceptedBride++; break;
                  case "bridegroom's": localAcceptedGroom++; break;
                  case 'shared': localAcceptedShared++; break;
                  case 'service': localAcceptedService++; break;
                  default: localAcceptedOther++;
                }
              } else if (guest.rsvpStatus === 'declined') {
                localTotalDeclined++;
                switch (guest.category) {
                  case "bride's": localDeclinedBride++; break;
                  case "bridegroom's": localDeclinedGroom++; break;
                  case 'shared': localDeclinedShared++; break;
                  case 'service': localDeclinedService++; break;
                  default: localDeclinedOther++;
                }
              }
            });
            
            setTotalGuestCount(guestsList.length);
            setTotalMarkedAsInvitedCount(localMarkedAsInvited);
            setBrideGuestCount(localBrideCount);
            setGroomGuestCount(localGroomCount);
            setSharedGuestCount(localSharedCount);
            setServiceGuestCount(localServiceCount);
            const localOtherTotal = guestsList.length - (localBrideCount + localGroomCount + localSharedCount + localServiceCount);
            setOtherCategoryGuestCount(localOtherTotal > 0 ? localOtherTotal : 0);

            setTotalAcceptedCount(localTotalAccepted);
            setAcceptedBrideGuestCount(localAcceptedBride);
            setAcceptedGroomGuestCount(localAcceptedGroom);
            setAcceptedSharedGuestCount(localAcceptedShared);
            setAcceptedServiceGuestCount(localAcceptedService);
            setAcceptedOtherGuestCount(localAcceptedOther);

            setTotalDeclinedCount(localTotalDeclined);
            setDeclinedBrideGuestCount(localDeclinedBride);
            setDeclinedGroomGuestCount(localDeclinedGroom);
            setDeclinedSharedGuestCount(localDeclinedShared);
            setDeclinedServiceGuestCount(localDeclinedService);
            setDeclinedOtherGuestCount(localDeclinedOther);
            
            setRsvpsReceivedCount(localTotalAccepted + localTotalDeclined);
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
        setTotalGuestCount(0);
        setTotalMarkedAsInvitedCount(0);
        setBrideGuestCount(0);
        setGroomGuestCount(0);
        setSharedGuestCount(0);
        setServiceGuestCount(0);
        setOtherCategoryGuestCount(0);
        setTotalAcceptedCount(0); setAcceptedBrideGuestCount(0); setAcceptedGroomGuestCount(0); setAcceptedSharedGuestCount(0); setAcceptedServiceGuestCount(0); setAcceptedOtherGuestCount(0);
        setTotalDeclinedCount(0); setDeclinedBrideGuestCount(0); setDeclinedGroomGuestCount(0); setDeclinedSharedGuestCount(0); setDeclinedServiceGuestCount(0); setDeclinedOtherGuestCount(0);
        setRsvpsReceivedCount(0);

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
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "loading..." : 
                    `${totalMarkedAsInvitedCount} ${totalMarkedAsInvitedCount === 1 ? "guest marked as invited" : "guests marked as invited"}`
                  }
                </p>
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
                 {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-3xl font-bold text-foreground">{rsvpsReceivedCount}</div>
                        <p className="text-xs text-muted-foreground">responded</p>
                        {rsvpsReceivedCount > 0 && (
                        <>
                            <div className="mt-2 text-xs text-muted-foreground">
                            Accepted: {totalAcceptedCount}
                            {totalAcceptedCount > 0 && (
                                <div className="ml-2 flex flex-wrap gap-x-2 gap-y-1">
                                <span>Bride: {acceptedBrideGuestCount}</span>
                                <span className="hidden sm:inline">|</span>
                                <span>Groom: {acceptedGroomGuestCount}</span>
                                <span className="hidden sm:inline">|</span>
                                <span>Shared: {acceptedSharedGuestCount}</span>
                                {acceptedServiceGuestCount > 0 && (<><span className="hidden sm:inline">|</span><span>Service: {acceptedServiceGuestCount}</span></>)}
                                {acceptedOtherGuestCount > 0 && (<><span className="hidden sm:inline">|</span><span>Other: {acceptedOtherGuestCount}</span></>)}
                                </div>
                            )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                            Declined: {totalDeclinedCount}
                            {totalDeclinedCount > 0 && (
                                <div className="ml-2 flex flex-wrap gap-x-2 gap-y-1">
                                <span>Bride: {declinedBrideGuestCount}</span>
                                <span className="hidden sm:inline">|</span>
                                <span>Groom: {declinedGroomGuestCount}</span>
                                <span className="hidden sm:inline">|</span>
                                <span>Shared: {declinedSharedGuestCount}</span>
                                {declinedServiceGuestCount > 0 && (<><span className="hidden sm:inline">|</span><span>Service: {declinedServiceGuestCount}</span></>)}
                                {declinedOtherGuestCount > 0 && (<><span className="hidden sm:inline">|</span><span>Other: {declinedOtherGuestCount}</span></>)}
                                </div>
                            )}
                            </div>
                        </>
                        )}
                    </>
                 )}
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <GanttChart className="mr-2 h-4 w-4" />
                  Planner Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-3xl font-bold text-foreground">{plannerProgress}%</div>
                <Progress value={plannerProgress} />
                <div className="mt-1 text-xs text-muted-foreground">
                  <Link href="/dashboard/planner" className="underline">Open Planner</Link>
                </div>
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

