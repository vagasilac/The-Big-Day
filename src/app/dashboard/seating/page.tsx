
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Heart, PlusCircle, Armchair, LayoutGrid, Search, ExternalLink, CheckCircle, Info } from 'lucide-react'; // Using Armchair for seating
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { VenueLayout } from '@/types/venue'; // Import the new type

// Mock data for venue layouts - replace with Firestore fetching later
const MOCK_VENUE_LAYOUTS: VenueLayout[] = [
  {
    id: 'layout-1',
    name: 'The Grand Ballroom',
    description: 'A spacious and elegant ballroom suitable for large weddings. Features a large dance floor and stage area.',
    capacity: 250,
    previewImageUrl: 'https://placehold.co/600x400.png?text=Grand+Ballroom',
    ownerId: 'system',
  },
  {
    id: 'layout-2',
    name: 'Rustic Barn Charm',
    description: 'A cozy barn setting with wooden beams and string lights, perfect for a rustic themed wedding.',
    capacity: 120,
    previewImageUrl: 'https://placehold.co/600x400.png?text=Rustic+Barn',
    ownerId: 'system',
  },
  {
    id: 'layout-3',
    name: 'Modern City View Loft',
    description: 'A chic loft with panoramic city views, ideal for a contemporary and stylish event.',
    capacity: 80,
    previewImageUrl: 'https://placehold.co/600x400.png?text=City+Loft',
    ownerId: 'venue-owner-123', // Example of a venue-owner provided layout
  },
];

export default function SeatingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [venueLayouts, setVenueLayouts] = useState<VenueLayout[]>(MOCK_VENUE_LAYOUTS);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null | undefined>(null);
  const [isSavingSelection, setIsSavingSelection] = useState(false);

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
            const currentWeddingData = { id: weddingDoc.id, ...weddingDoc.data() } as Wedding;
            setWeddingData(currentWeddingData);
            setSelectedLayoutId(currentWeddingData.selectedVenueLayoutId);
          } else {
            setWeddingData(null);
          }
        } catch (error) {
          console.error("Error fetching wedding data:", error);
          toast({ title: 'Error', description: 'Could not load wedding details.', variant: 'destructive' });
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
  }, [router, toast]);

  const handleSelectLayout = async (layoutId: string) => {
    if (!currentUser || !weddingData?.id) {
      toast({ title: "Error", description: "User or wedding data not found.", variant: "destructive" });
      return;
    }
    setIsSavingSelection(true);
    try {
      const weddingRef = doc(db, 'weddings', weddingData.id);
      await updateDoc(weddingRef, {
        selectedVenueLayoutId: layoutId,
      });
      setSelectedLayoutId(layoutId);
      // Update local weddingData state to reflect change immediately
      setWeddingData(prev => prev ? ({ ...prev, selectedVenueLayoutId: layoutId }) : null);
      toast({ title: "Layout Selected", description: "Venue layout has been updated for your wedding." });
    } catch (error) {
      console.error("Error selecting layout:", error);
      toast({ title: "Error", description: "Failed to select venue layout.", variant: "destructive" });
    } finally {
      setIsSavingSelection(false);
    }
  };
  
  const handleClearSelection = async () => {
    if (!currentUser || !weddingData?.id) {
        toast({ title: "Error", description: "User or wedding data not found.", variant: "destructive" });
        return;
    }
    setIsSavingSelection(true);
    try {
        const weddingRef = doc(db, 'weddings', weddingData.id);
        await updateDoc(weddingRef, {
            selectedVenueLayoutId: null, // or deleteField() if you prefer to remove it
        });
        setSelectedLayoutId(null);
        setWeddingData(prev => prev ? ({ ...prev, selectedVenueLayoutId: undefined }) : null);
        toast({ title: "Layout Cleared", description: "Venue layout selection has been cleared." });
    } catch (error) {
        console.error("Error clearing layout selection:", error);
        toast({ title: "Error", description: "Failed to clear layout selection.", variant: "destructive" });
    } finally {
        setIsSavingSelection(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
                <Skeleton className="h-10 w-60 mb-2" />
                <Skeleton className="h-5 w-80" />
            </div>
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full" />
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!weddingData) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center gap-3">
            <Armchair className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Seating Arrangements</h1>
                <p className="text-muted-foreground mt-1">
                Plan and visualize your event's seating layout.
                </p>
            </div>
        </div>
        <Card className="border-dashed border-2 p-8 text-center shadow-sm">
          <Heart className="h-12 w-12 mx-auto text-primary/40 mb-4" />
          <CardTitle className="text-xl font-semibold mb-2">No Wedding Site Yet</CardTitle>
          <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please create your wedding site first to manage seating arrangements.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/details">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your Wedding Site
            </Link>
          </Button>
        </Card>
      </div>
    );
  }
  
  const currentSelectedLayoutDetails = venueLayouts.find(layout => layout.id === selectedLayoutId);

  // If a layout is selected, show the next step UI, otherwise show layout selection
  if (selectedLayoutId && currentSelectedLayoutDetails) {
    return (
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Armchair className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Seating Chart for {weddingData.title}</h1>
                    <p className="text-muted-foreground mt-1">
                    Venue Layout: <span className="font-semibold text-primary">{currentSelectedLayoutDetails.name}</span>
                    </p>
                </div>
            </div>
            <Button variant="outline" onClick={handleClearSelection} disabled={isSavingSelection}>
                Change Layout
            </Button>
        </div>

        {/* Placeholder for two-pane layout: Guest List | Visual Layout */}
        <Alert>
          <LayoutGrid className="h-4 w-4" />
          <AlertTitle>Seating Planner Interface</AlertTitle>
          <AlertDescription>
            The interactive seating chart planner will be displayed here. You'll be able to drag and drop guests onto seats within the '{currentSelectedLayoutDetails.name}' layout.
            <div className="mt-4 p-6 bg-secondary/50 rounded-md text-center">
                <p className="font-medium text-secondary-foreground">Interactive seating planner for "{currentSelectedLayoutDetails.name}" coming soon!</p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  // Layout Selection UI
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex items-center gap-3">
          <Armchair className="h-8 w-8 text-primary" />
          <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Choose a Venue Layout</h1>
              <p className="text-muted-foreground mt-1">
              Select a base layout for your seating arrangements or create a new one.
              </p>
          </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
        <div className="relative w-full sm:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search layouts..." className="pl-10 h-10" />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" disabled>
                <ExternalLink className="mr-2 h-4 w-4" /> Request from Venue (Soon)
            </Button>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Layout (Soon)
            </Button>
        </div>
      </div>

      {currentSelectedLayoutDetails && (
        <Alert variant="default" className="mb-6 border-primary/30 bg-primary/5">
          <CheckCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">Layout Selected: {currentSelectedLayoutDetails.name}</AlertTitle>
          <AlertDescription>
            You are currently using the '{currentSelectedLayoutDetails.name}' layout. Proceed to assign guests or{' '}
            <Button variant="link" className="p-0 h-auto text-sm text-primary hover:underline" onClick={handleClearSelection} disabled={isSavingSelection}>
                 change layout
            </Button>.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venueLayouts.map((layout) => (
          <Card key={layout.id} className={`shadow-lg hover:shadow-xl transition-shadow flex flex-col ${selectedLayoutId === layout.id ? 'border-2 border-primary ring-2 ring-primary ring-offset-2' : ''}`}>
            {layout.previewImageUrl && (
                <div className="relative w-full h-48 bg-secondary rounded-t-md overflow-hidden">
                 <Image src={layout.previewImageUrl} alt={layout.name} layout="fill" objectFit="cover" data-ai-hint="venue layout" />
                </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{layout.name}</CardTitle>
              <CardDescription>
                {layout.capacity && `Capacity: ${layout.capacity} guests`}
                {layout.ownerId !== 'system' && <span className="text-xs block mt-1 text-muted-foreground/80">Provided by venue</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{layout.description || "No description available."}</p>
            </CardContent>
            <CardFooter>
              {selectedLayoutId === layout.id ? (
                <Button className="w-full" variant="outline" disabled>
                    <CheckCircle className="mr-2 h-4 w-4" /> Currently Selected
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleSelectLayout(layout.id)} disabled={isSavingSelection}>
                    {isSavingSelection && <Skeleton className="mr-2 h-4 w-4 animate-spin" />}
                    Select this Layout
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {venueLayouts.length === 0 && (
         <Card className="p-8 text-center shadow-sm">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">No Venue Layouts Found</CardTitle>
            <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
                It seems there are no venue layouts available yet. You can create one or request it from your venue.
            </CardDescription>
        </Card>
      )}
    </div>
  );
}
