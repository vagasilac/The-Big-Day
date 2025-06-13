
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Heart, PlusCircle, Armchair, LayoutGrid, Search, ExternalLink, CheckCircle, Info, Users as UsersIcon, Loader2, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy, deleteDoc, Timestamp, or } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { VenueLayout } from '@/types/venue';
import type { Guest } from '@/types/guest';

export default function SeatingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [weddingData, setWeddingData] = useState<Wedding | null>(null);
  const [isLoadingUserWeddingData, setIsLoadingUserWeddingData] = useState(true);
  
  const [venueLayouts, setVenueLayouts] = useState<VenueLayout[]>([]);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null | undefined>(null);
  const [isSavingSelection, setIsSavingSelection] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);

  const [layoutToDelete, setLayoutToDelete] = useState<VenueLayout | null>(null);
  const [isDeletingLayout, setIsDeletingLayout] = useState(false);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoadingUserWeddingData(true);
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
          setIsLoadingUserWeddingData(false);
        }
      } else {
        setCurrentUser(null);
        setWeddingData(null);
        setSelectedLayoutId(null);
        router.push('/auth');
        setIsLoadingUserWeddingData(false);
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);

  const fetchLayouts = useCallback(async (user: User) => {
    setIsLoadingLayouts(true);
    try {
      const layoutsRef = collection(db, 'venueLayouts');
      const qLayouts = query(
        layoutsRef,
        or(
          where('ownerId', '==', user.uid), 
          where('isPublic', '==', true)      
        ),
        orderBy('createdAt', 'desc')
      );
      const layoutSnapshot = await getDocs(qLayouts);
      const fetchedLayouts = layoutSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : undefined,
        } as VenueLayout;
      });
      setVenueLayouts(fetchedLayouts);
    } catch (error: any) {
      console.error("Error fetching venue layouts:", error);
      if (error.code === 'failed-precondition') {
         toast({ title: 'Indexing Required', description: 'Firestore needs an index for this query. Please check the Firebase console for instructions to create it.', variant: 'destructive', duration: 10000 });
      } else {
        toast({ title: 'Error Loading Layouts', description: 'Could not fetch venue layouts. ' + error.message, variant: 'destructive' });
      }
      setVenueLayouts([]);
    } finally {
      setIsLoadingLayouts(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchLayouts(currentUser);
    }
  }, [currentUser, fetchLayouts]);


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
            selectedVenueLayoutId: null, 
        });
        setSelectedLayoutId(null);
        setWeddingData(prev => prev ? ({ ...prev, selectedVenueLayoutId: undefined }) : null);
        setGuests([]); 
        toast({ title: "Layout Cleared", description: "Venue layout selection has been cleared." });
    } catch (error) {
        console.error("Error clearing layout selection:", error);
        toast({ title: "Error", description: "Failed to clear layout selection.", variant: "destructive" });
    } finally {
        setIsSavingSelection(false);
    }
  };

  const handleDeleteLayout = async () => {
    if (!layoutToDelete || !layoutToDelete.id || !currentUser) {
        toast({ title: "Error", description: "Layout or user information is missing.", variant: "destructive" });
        return;
    }
    setIsDeletingLayout(true);
    try {
        await deleteDoc(doc(db, 'venueLayouts', layoutToDelete.id));

        if (weddingData?.selectedVenueLayoutId === layoutToDelete.id) {
            await handleClearSelection(); // This will also clear local selectedLayoutId and weddingData.selectedVenueLayoutId
        }
        
        setVenueLayouts(prevLayouts => prevLayouts.filter(l => l.id !== layoutToDelete.id));
        toast({ title: "Layout Deleted", description: `Layout "${layoutToDelete.name}" has been successfully deleted.` });
    } catch (error: any) {
        console.error("Error deleting layout:", error);
        toast({ title: "Deletion Failed", description: `Could not delete layout. ${error.message || 'Unknown error.'}`, variant: "destructive" });
    } finally {
        setIsDeletingLayout(false);
        setLayoutToDelete(null); // Close dialog
    }
  };

  const filteredLayouts = useMemo(() => {
    if (!searchTerm) return venueLayouts;
    return venueLayouts.filter(layout =>
      layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (layout.description && layout.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [venueLayouts, searchTerm]);

  if (isLoadingUserWeddingData) {
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

  if (selectedLayoutId && currentSelectedLayoutDetails) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 h-[calc(100vh-10rem)]">
        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                <Armchair className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Seating Chart: {weddingData.title}</h1>
                    <p className="text-muted-foreground mt-1">
                    Venue Layout: <span className="font-semibold text-primary">{currentSelectedLayoutDetails.name}</span> (Capacity: {currentSelectedLayoutDetails.totalCapacity})
                    </p>
                </div>
            </div>
            <Button variant="outline" onClick={handleClearSelection} disabled={isSavingSelection}>
                {isSavingSelection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Layout
            </Button>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
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
                <p className="text-muted-foreground text-center py-4">No guests found. Add guests in Guest Management.</p>
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

          <Card className="md:col-span-2 xl:col-span-3 flex flex-col shadow-lg">
            <CardHeader className="flex-shrink-0 border-b">
              <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary" /> Venue: {currentSelectedLayoutDetails.name}</CardTitle>
               <div className="flex justify-between items-center">
                <CardDescription>Drag guests to tables. Max Capacity: {currentSelectedLayoutDetails.totalCapacity}</CardDescription>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon", description: "Editing this layout will be available soon!"})} >
                    <Edit className="mr-2 h-3 w-3"/> Edit This Layout
                </Button>
               </div>
            </CardHeader>
            
            <div className="flex flex-col flex-grow overflow-hidden">
              <div className="flex-grow bg-background border-r p-4 relative overflow-auto">
                  <div 
                    className="w-full h-full min-h-[400px] bg-white rounded-md shadow-inner"
                    style={{
                      backgroundImage: currentSelectedLayoutDetails.previewImageUrl 
                        ? `url(${currentSelectedLayoutDetails.previewImageUrl})`
                        : 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                      backgroundSize: currentSelectedLayoutDetails.previewImageUrl ? 'contain' : '20px 20px',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center'
                    }}
                    data-ai-hint={currentSelectedLayoutDetails.previewImageUrl ? "venue layout" : "grid background"}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                      <p className="text-muted-foreground p-4 bg-background/80 rounded-md text-lg">
                        Interactive Seating Editor Area (Coming Soon)
                      </p>
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
            <Input 
              placeholder="Search layouts by name or description..." 
              className="pl-10 h-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

      {isLoadingLayouts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-2" /></CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
              </Card>
            ))}
        </div>
      ) : filteredLayouts.length === 0 ? (
        <Card className="p-8 text-center shadow-sm col-span-full">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">No Venue Layouts Found</CardTitle>
            <CardDescription className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm ? "No layouts match your search. " : "It seems there are no venue layouts available yet. "}
                Try adjusting your search or create a new one.
            </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLayouts.map((layout) => (
            <Card key={layout.id} className={`shadow-lg hover:shadow-xl transition-shadow flex flex-col ${selectedLayoutId === layout.id ? 'border-2 border-primary ring-2 ring-primary ring-offset-2' : ''}`}>
              {layout.previewImageUrl ? (
                  <div className="relative w-full h-48 bg-secondary rounded-t-md overflow-hidden">
                  <Image 
                    src={layout.previewImageUrl} 
                    alt={layout.name || 'Venue layout preview'} 
                    layout="fill" 
                    objectFit="cover" 
                    data-ai-hint={layout.dataAiHint || "venue layout"} />
                  </div>
              ) : (
                <div className="w-full h-48 bg-muted rounded-t-md flex items-center justify-center">
                  <LayoutGrid className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{layout.name}</CardTitle>
                <CardDescription>
                  {layout.totalCapacity && `Capacity: ${layout.totalCapacity} guests`}
                  {layout.ownerId !== currentUser?.uid && layout.isPublic && <span className="text-xs block mt-1 text-green-600 dark:text-green-400">Public Template</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{layout.description || "No description available."}</p>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2">
                {selectedLayoutId === layout.id ? ( 
                  <Button className="w-full" variant="outline" disabled>
                      <CheckCircle className="mr-2 h-4 w-4" /> Currently Selected
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleSelectLayout(layout.id!)} disabled={isSavingSelection || isLoadingUserWeddingData}>
                      {(isSavingSelection || isLoadingUserWeddingData) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Select this Layout
                  </Button>
                )}
                 {layout.ownerId === currentUser?.uid && (
                    <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast({ title: "Coming Soon", description: "Editing layouts will be available soon!"})}>
                            <Edit className="mr-1.5 h-3 w-3" /> Edit
                        </Button>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setLayoutToDelete(layout)}>
                                <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                    </div>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {layoutToDelete && (
        <AlertDialog open={!!layoutToDelete} onOpenChange={(open) => { if (!open) setLayoutToDelete(null); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete "{layoutToDelete.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the venue layout.
                        If this layout is currently selected for your wedding, the selection will be cleared.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setLayoutToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteLayout}
                        disabled={isDeletingLayout}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeletingLayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Layout
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

