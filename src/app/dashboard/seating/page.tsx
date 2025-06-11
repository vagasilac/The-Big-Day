
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Heart, PlusCircle, Armchair, LayoutGrid, Search, ExternalLink, CheckCircle, Info, Users as UsersIcon, Loader2, RectangleHorizontal, Circle as CircleIcon, Minimize2, Ruler, Settings2, Trash2, Undo2, Redo2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { VenueLayout } from '@/types/venue';
import type { Guest } from '@/types/guest';

// Mock data for venue layouts - replace with Firestore fetching later
const MOCK_VENUE_LAYOUTS: VenueLayout[] = [
  {
    id: 'layout-1',
    name: 'The Grand Ballroom',
    description: 'A spacious and elegant ballroom suitable for large weddings. Features a large dance floor and stage area.',
    capacity: 250,
    previewImageUrl: 'https://placehold.co/600x400.png?text=Grand+Ballroom',
    ownerId: 'system',
    dataAiHint: 'ballroom wedding venue'
  },
  {
    id: 'layout-2',
    name: 'Rustic Barn Charm',
    description: 'A cozy barn setting with wooden beams and string lights, perfect for a rustic themed wedding.',
    capacity: 120,
    previewImageUrl: 'https://placehold.co/600x400.png?text=Rustic+Barn',
    ownerId: 'system',
    dataAiHint: 'barn wedding venue'
  },
  {
    id: 'layout-3',
    name: 'Modern City View Loft',
    description: 'A chic loft with panoramic city views, ideal for a contemporary and stylish event.',
    capacity: 80,
    previewImageUrl: 'https://placehold.co/600x400.png?text=City+Loft',
    ownerId: 'venue-owner-123', // Example of a venue-owner provided layout
    dataAiHint: 'modern loft venue'
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

  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoading(true);
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
            setSelectedLayoutId(null);
          }
        } catch (error) {
          console.error("Error fetching wedding data:", error);
          toast({ title: 'Error', description: 'Could not load wedding details.', variant: 'destructive' });
          setWeddingData(null);
          setSelectedLayoutId(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setWeddingData(null);
        setSelectedLayoutId(null);
        router.push('/auth');
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);

  const fetchGuests = useCallback(async (weddingId: string) => {
    if (!weddingId) return;
    setIsLoadingGuests(true);
    const guestsRef = collection(db, 'weddings', weddingId, 'guests');
    const unsubscribeGuests = onSnapshot(guestsRef, (snapshot) => {
      const guestList: Guest[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Guest, 'id'>) }));
      setGuests(guestList);
      setIsLoadingGuests(false);
    }, (error) => {
      console.error("Error fetching guests:", error);
      toast({ title: 'Error', description: 'Could not load guest list for seating.', variant: 'destructive' });
      setIsLoadingGuests(false);
    });
    return unsubscribeGuests;
  }, [toast]);

  useEffect(() => {
    let unsubscribeGuests: (() => void) | undefined;
    if (weddingData?.id && selectedLayoutId) {
      (async () => {
        unsubscribeGuests = await fetchGuests(weddingData.id);
      })();
    }
    return () => {
      if (unsubscribeGuests) {
        unsubscribeGuests();
      }
    };
  }, [weddingData, selectedLayoutId, fetchGuests]);


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
            selectedVenueLayoutId: null, // Set to null or use deleteField()
        });
        setSelectedLayoutId(null);
        setWeddingData(prev => prev ? ({ ...prev, selectedVenueLayoutId: undefined }) : null);
        setGuests([]); // Clear guests when layout is cleared
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

  // If a layout is selected, show the two-pane planner UI
  if (selectedLayoutId && currentSelectedLayoutDetails) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <Armchair className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Seating Chart: {weddingData.title}</h1>
                    <p className="text-muted-foreground mt-1">
                    Venue Layout: <span className="font-semibold text-primary">{currentSelectedLayoutDetails.name}</span> (Capacity: {currentSelectedLayoutDetails.capacity})
                    </p>
                </div>
            </div>
            <Button variant="outline" onClick={handleClearSelection} disabled={isSavingSelection}>
                {isSavingSelection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Layout
            </Button>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
          {/* Left Pane: Guest List */}
          <Card className="md:col-span-1 xl:col-span-1 flex flex-col shadow-lg">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" /> Guest List</CardTitle>
              <CardDescription>{guests.length} guests loaded. Drag to assign.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-4 space-y-2">
              {isLoadingGuests ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : guests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No guests found for this wedding yet. Add guests in the Guest Management section.</p>
              ) : (
                guests.map(guest => (
                  <div key={guest.id} className="p-3 border rounded-md bg-background hover:bg-secondary cursor-grab">
                    <p className="font-medium text-sm text-foreground">{guest.name}</p>
                    {guest.isPlusOneFor && <p className="text-xs text-muted-foreground">Plus one for {guests.find(g => g.id === guest.isPlusOneFor)?.name}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Right Pane: Visual Layout Editor */}
          <Card className="md:col-span-2 xl:col-span-3 flex flex-col shadow-lg">
            <CardHeader className="flex-shrink-0 border-b">
              <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary" /> Venue Layout Editor</CardTitle>
              <CardDescription>Design your venue: {currentSelectedLayoutDetails.name}</CardDescription>
            </CardHeader>
            
            <div className="flex flex-col flex-grow overflow-hidden">
              {/* Toolbar */}
              <div className="p-2 border-b bg-muted/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled title="Add Rectangle Table (coming soon)">
                    <RectangleHorizontal className="mr-2 h-4 w-4" /> Table
                  </Button>
                  <Button variant="outline" size="sm" disabled title="Add Round Table (coming soon)">
                    <CircleIcon className="mr-2 h-4 w-4" /> Round Table
                  </Button>
                  <Button variant="outline" size="sm" disabled title="Add Stage (coming soon)">
                    <Minimize2 className="mr-2 h-4 w-4 transform rotate-45" /> Stage
                  </Button>
                   <Button variant="outline" size="sm" disabled title="Add Wall/Divider (coming soon)">
                    <Ruler className="mr-2 h-4 w-4" /> Wall
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <Button variant="ghost" size="icon" disabled title="Undo (coming soon)">
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled title="Redo (coming soon)">
                    <Redo2 className="h-4 w-4" />
                  </Button>
                   <Separator orientation="vertical" className="h-6 mx-2" />
                   <Button variant="ghost" size="icon" disabled title="Save Layout (coming soon)">
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Canvas Area & Properties Panel (simplified side-by-side) */}
              <div className="flex flex-grow overflow-hidden">
                {/* Main Canvas Area */}
                <div className="flex-grow bg-background border-r p-4 relative overflow-auto">
                  <div 
                    className="w-full h-full min-h-[400px] bg-white rounded-md shadow-inner"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  >
                    {/* Layout elements will be rendered here */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-muted-foreground p-4 bg-background/80 rounded-md">Layout Editor Canvas Area</p>
                    </div>
                  </div>
                </div>

                {/* Properties Panel Placeholder */}
                <div className="w-64 p-4 border-l bg-muted/30 flex-shrink-0 overflow-y-auto">
                  <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center">
                    <Settings2 className="mr-2 h-4 w-4 text-primary" /> Element Properties
                  </h3>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Select an element on the canvas to edit its properties. (Coming Soon)
                    </p>
                    {/* Example property fields (disabled) */}
                    <div>
                      <label htmlFor="element-name" className="text-xs font-medium">Name</label>
                      <Input id="element-name" size="sm" disabled placeholder="Table 1" className="mt-1"/>
                    </div>
                     <div>
                      <label htmlFor="element-width" className="text-xs font-medium">Width</label>
                      <Input id="element-width" type="number" size="sm" disabled placeholder="120" className="mt-1"/>
                    </div>
                     <div>
                      <label htmlFor="element-height" className="text-xs font-medium">Height</label>
                      <Input id="element-height" type="number" size="sm" disabled placeholder="60" className="mt-1"/>
                    </div>
                     <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive" disabled>
                        <Trash2 className="mr-2 h-4 w-4"/> Delete Element
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
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
            <Button asChild>
                <Link href="/dashboard/seating/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Layout
                </Link>
            </Button>
        </div>
      </div>

      {currentSelectedLayoutDetails && weddingData.selectedVenueLayoutId && (
        <Alert variant="default" className="mb-6 border-primary/30 bg-primary/5">
          <CheckCircle className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">Layout Selected: {currentSelectedLayoutDetails.name}</AlertTitle>
          <AlertDescription>
            You are currently using the '{currentSelectedLayoutDetails.name}' layout. Proceed to assign guests or{' '}
            <Button variant="link" className="p-0 h-auto text-sm text-primary hover:underline" onClick={handleClearSelection} disabled={isSavingSelection}>
                 {isSavingSelection && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}change layout
            </Button>.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venueLayouts.map((layout) => (
          <Card key={layout.id} className={`shadow-lg hover:shadow-xl transition-shadow flex flex-col ${selectedLayoutId === layout.id ? 'border-2 border-primary ring-2 ring-primary ring-offset-2' : ''}`}>
            {layout.previewImageUrl && (
                <div className="relative w-full h-48 bg-secondary rounded-t-md overflow-hidden">
                 <Image src={layout.previewImageUrl} alt={layout.name} layout="fill" objectFit="cover" data-ai-hint={layout.dataAiHint || "venue layout"} />
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
                <Button className="w-full" onClick={() => handleSelectLayout(layout.id)} disabled={isSavingSelection || isLoading}>
                    {(isSavingSelection || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

// Missing Undo2, Redo2, Save icons - import them if available or use alternatives
// For now, let's assume they are available or will be handled.
// If not, I'll need to remove or replace them. Let's use generic placeholders for now if they don't exist.
// For simplicity, I will remove them for now from the imports if they are not already standard in lucide-react.
// Looking at lucide-react, Undo2, Redo2, Save are available.

    

    