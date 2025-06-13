
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Konva from 'konva';
import { Stage, Layer, Rect as KonvaRect, Circle as KonvaCircle, Group, Text, Line, Label as KonvaLabel, Tag as KonvaTag } from 'react-konva';

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
import { Heart, PlusCircle, Armchair, LayoutGrid, Search, ExternalLink, CheckCircle, Users as UsersIcon, Loader2, Trash2, Edit, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy, deleteDoc, Timestamp, or, serverTimestamp } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import type { VenueLayout, TableElement as VenueTableElement, Chair as VenueChair } from '@/types/venue';
import type { Guest } from '@/types/guest';

const FONT_SIZE_NUMBER_RECT = 14;
const FONT_SIZE_CAPACITY_RECT = 10;
const FONT_SIZE_NUMBER_CIRCLE = 16;
const FONT_SIZE_CAPACITY_CIRCLE = 12;
const TEXT_VERTICAL_GAP = 4;
const CHAIR_RADIUS = 10;
const ASSIGNED_CHAIR_FILL = '#a5d6a7'; // Soft green for assigned chairs
const CHAIR_TEXT_COLOR = '#1b5e20'; // Dark green for text on assigned chairs

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

  const [seatingAssignments, setSeatingAssignments] = useState<Record<string, { guestId: string; guestName: string }>>({});
  const [draggedGuestInfo, setDraggedGuestInfo] = useState<{ guestId: string; guestName: string } | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageDimensions, setStageDimensions] = React.useState({ width: 800, height: 600 });
  const editorCanvasContainerRef = useRef<HTMLDivElement>(null);

  const [hoveredChairInfo, setHoveredChairInfo] = useState<{ guestName: string; x: number; y: number } | null>(null);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);


  useEffect(() => {
    const updateDimensions = () => {
      if (editorCanvasContainerRef.current) {
        setStageDimensions({
          width: editorCanvasContainerRef.current.offsetWidth > 0 ? editorCanvasContainerRef.current.offsetWidth - 2 : 800,
          height: editorCanvasContainerRef.current.offsetHeight > 0 ? editorCanvasContainerRef.current.offsetHeight - 2 : 600,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const robserver = new ResizeObserver(updateDimensions);
    if (editorCanvasContainerRef.current) {
      robserver.observe(editorCanvasContainerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (editorCanvasContainerRef.current) {
        robserver.unobserve(editorCanvasContainerRef.current);
      }
    }
  }, [selectedLayoutId]); // Re-check dimensions if selectedLayoutId changes (triggers re-render of canvas area)

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
            if (currentWeddingData.selectedVenueLayoutId && currentWeddingData.seatingAssignments) {
              setSeatingAssignments(currentWeddingData.seatingAssignments);
            } else {
              setSeatingAssignments({});
            }
          } else {
            setWeddingData(null);
            setSelectedLayoutId(null);
            setSeatingAssignments({});
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
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
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
      setGuests(guestList.filter(g => g.rsvpStatus === 'accepted')); // Only show accepted guests for seating
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
    } else {
      setGuests([]); // Clear guests if no wedding or layout is selected
    }
    return () => {
      if (unsubscribeGuests) {
        unsubscribeGuests();
      }
    };
  }, [weddingData, selectedLayoutId, fetchGuests]);

  const saveSeatingAssignmentsToFirestore = async (assignmentsToSave: Record<string, { guestId: string; guestName: string }>) => {
    if (!weddingData?.id || !selectedLayoutId) {
      console.warn("Cannot save assignments: missing wedding ID or selected layout ID.");
      return;
    }
    setIsSavingAssignments(true);
    try {
      const weddingRef = doc(db, 'weddings', weddingData.id);
      await updateDoc(weddingRef, {
        seatingAssignments: assignmentsToSave,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Seating Saved", description: "Assignments have been automatically saved.", duration: 2000 });
    } catch (error: any) {
      console.error("Error saving seating assignments:", error);
      toast({ title: "Save Error", description: "Could not save seating assignments: " + error.message, variant: "destructive" });
    } finally {
      setIsSavingAssignments(false);
    }
  };

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
        seatingAssignments: {}, // Clear assignments when changing layout
      });
      setSelectedLayoutId(layoutId);
      // Update local weddingData state as well to reflect the change immediately
      setWeddingData(prev => {
        if (prev) {
          const newWeddingData = { ...prev, selectedVenueLayoutId: layoutId, seatingAssignments: {} };
          // Also update the local seatingAssignments state from the (now cleared) weddingData
          setSeatingAssignments(newWeddingData.seatingAssignments || {});
          return newWeddingData;
        }
        return null;
      });
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
        selectedVenueLayoutId: null, // Use null to clear in Firestore
        seatingAssignments: {}, // Clear assignments
      });
      setSelectedLayoutId(null);
      // Update local weddingData state as well
      setWeddingData(prev => {
        if (prev) {
          const newWeddingData = { ...prev, selectedVenueLayoutId: undefined, seatingAssignments: {} };
           // Update local seatingAssignments state
           setSeatingAssignments(newWeddingData.seatingAssignments || {});
          return newWeddingData;
        }
        return null;
      });
      setGuests([]); // Clear guests list as no layout is selected
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
    if (layoutToDelete.ownerId !== currentUser.uid) {
      toast({ title: "Permission Denied", description: "You can only delete layouts you own.", variant: "destructive" });
      return;
    }
    setIsDeletingLayout(true);
    try {
      // Before deleting, check if this layout is selected for the current wedding
      if (weddingData?.selectedVenueLayoutId === layoutToDelete.id) {
        // If it is, clear the selection in Firestore first
        const weddingRef = doc(db, 'weddings', weddingData.id);
        await updateDoc(weddingRef, {
          selectedVenueLayoutId: null,
          seatingAssignments: {},
        });
        setSelectedLayoutId(null);
        setSeatingAssignments({});
        setWeddingData(prev => prev ? { ...prev, selectedVenueLayoutId: undefined, seatingAssignments: {} } : null);
      }

      await deleteDoc(doc(db, 'venueLayouts', layoutToDelete.id));
      setVenueLayouts(prevLayouts => prevLayouts.filter(l => l.id !== layoutToDelete.id));
      toast({ title: "Layout Deleted", description: `Layout "${layoutToDelete.name}" has been successfully deleted.` });
    } catch (error: any) {
      console.error("Error deleting layout:", error);
      toast({ title: "Deletion Failed", description: `Could not delete layout. ${error.message || 'Unknown error.'}`, variant: "destructive" });
    } finally {
      setIsDeletingLayout(false);
      setLayoutToDelete(null);
    }
  };

  const filteredLayouts = useMemo(() => {
    if (!searchTerm) return venueLayouts;
    return venueLayouts.filter(layout =>
      layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (layout.description && layout.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [venueLayouts, searchTerm]);

  // Drag and Drop Handlers for Seating
  const handleDropOnChair = (droppedChairId: string) => {
    if (!draggedGuestInfo) return;

    const newAssignments = { ...seatingAssignments };
    const { guestId: draggedGuestIdValue, guestName: draggedGuestNameValue } = draggedGuestInfo;

    // Unassign the dragged guest from any previous chair
    Object.keys(newAssignments).forEach(chairIdKey => {
      if (newAssignments[chairIdKey]?.guestId === draggedGuestIdValue) {
        delete newAssignments[chairIdKey];
      }
    });

    // Assign to the new chair
    newAssignments[droppedChairId] = { guestId: draggedGuestIdValue, guestName: draggedGuestNameValue };
    setSeatingAssignments(newAssignments);
    saveSeatingAssignmentsToFirestore(newAssignments); // Auto-save
    setDraggedGuestInfo(null);
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedGuestInfo || !stageRef.current) return;

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const shape = stage.getIntersection(point); // Get the shape at the drop position
    if (shape) {
      // Try to find the parent group that represents the chair
      const chairGroup = shape.findAncestor('.chair-group', true);
      if (chairGroup) {
        handleDropOnChair(chairGroup.id());
      }
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const assignedGuestIds = useMemo(() => {
    return new Set(Object.values(seatingAssignments).map(a => a.guestId));
  }, [seatingAssignments]);

  const unassignGuestFromChair = (chairIdToClear: string) => {
    const newAssignments = { ...seatingAssignments };
    delete newAssignments[chairIdToClear];
    setSeatingAssignments(newAssignments);
    saveSeatingAssignmentsToFirestore(newAssignments); // Auto-save
  };

  // Render loading state if user or wedding data is still loading
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

  // Render prompt to create wedding if no wedding data exists
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

  // If a layout is selected, show the interactive planner
  const currentSelectedLayoutDetails = venueLayouts.find(layout => layout.id === selectedLayoutId);

  if (selectedLayoutId && currentSelectedLayoutDetails) {
    const totalAssignedGuests = Object.keys(seatingAssignments).length;
    return (
      <div className="flex flex-col gap-6 md:gap-8 h-[calc(100vh-10rem)]"> {/* Ensure full height */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Armchair className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Seating Chart: {weddingData.title}</h1>
              <p className="text-muted-foreground mt-1">
                Venue Layout: <span className="font-semibold text-primary">{currentSelectedLayoutDetails.name}</span>
                (Capacity: {currentSelectedLayoutDetails.totalCapacity}, Assigned: {totalAssignedGuests})
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleClearSelection} disabled={isSavingSelection || isSavingAssignments}>
            {(isSavingSelection || isSavingAssignments) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change Layout
          </Button>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden"> {/* Ensure flex-grow and overflow-hidden */}
          {/* Guest List Panel */}
          <Card className="md:col-span-1 xl:col-span-1 flex flex-col shadow-lg">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5 text-primary" /> Accepted Guests</CardTitle>
              <CardDescription>{guests.length} guests who accepted. Drag to assign.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-4 space-y-2">
              {isLoadingGuests ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : guests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No accepted guests found.</p>
              ) : (
                guests.map(guest => {
                  const isAssigned = assignedGuestIds.has(guest.id!);
                  return (
                    <div
                      key={guest.id}
                      className={`p-3 border rounded-md cursor-grab transition-opacity ${isAssigned ? 'bg-muted/70 opacity-60 hover:opacity-80' : 'bg-background hover:bg-secondary'}`}
                      draggable={!isAssigned}
                      onDragStart={(e) => {
                        if (!isAssigned) {
                          try {
                            e.dataTransfer.setData('text/plain', guest.id!); // Required for Firefox
                            e.dataTransfer.effectAllowed = 'move';
                          } catch (err) {
                            // ignore unsupported browser errors
                          }
                          setDraggedGuestInfo({ guestId: guest.id!, guestName: guest.name });
                        }
                      }}
                      onDragEnd={() => setDraggedGuestInfo(null)}
                      title={isAssigned ? `${guest.name} is already seated` : `Drag ${guest.name} to a seat`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`font-medium text-sm ${isAssigned ? 'text-muted-foreground' : 'text-foreground'}`}>{guest.name}</p>
                        {isAssigned && <UserCheck className="h-4 w-4 text-green-600" />}
                      </div>
                      {guest.isPlusOneFor && <p className={`text-xs ${isAssigned ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>Plus one for {guests.find(g => g.id === guest.isPlusOneFor)?.name}</p>}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Seating Canvas Panel */}
          <Card className="md:col-span-2 xl:col-span-3 flex flex-col shadow-lg">
            <CardHeader className="flex-shrink-0 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-primary" /> Venue: {currentSelectedLayoutDetails.name}</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/seating/edit/${currentSelectedLayoutDetails.id}`}>
                    <Edit className="mr-2 h-3 w-3" /> Edit This Layout
                  </Link>
                </Button>
              </div>
              <CardDescription>Drag guests to tables. Max Capacity: {currentSelectedLayoutDetails.totalCapacity}</CardDescription>
            </CardHeader>

            <div ref={editorCanvasContainerRef} className="flex flex-col flex-grow overflow-hidden"> {/* Ensure flex-grow and overflow-hidden */}
              <div
                className="flex-grow bg-background border-r p-0 relative overflow-auto" // Changed from overflow-hidden to overflow-auto for scrolling if needed
                onDragOver={handleCanvasDragOver} // Allow dropping on the canvas area
                onDrop={handleCanvasDrop} // Handle drops on the canvas (e.g., to unassign if not on a chair)
              >
                <Stage
                  ref={stageRef}
                  width={stageDimensions.width}
                  height={stageDimensions.height}
                  className="bg-white rounded-b-md shadow-inner"
                  style={{
                    backgroundImage: currentSelectedLayoutDetails.previewImageUrl
                      ? `url(${currentSelectedLayoutDetails.previewImageUrl})`
                      : 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    backgroundSize: currentSelectedLayoutDetails.previewImageUrl ? 'contain' : '20px 20px',
                    backgroundRepeat: currentSelectedLayoutDetails.previewImageUrl ? 'no-repeat' : 'repeat',
                    backgroundPosition: 'center'
                  }}
                  data-ai-hint={currentSelectedLayoutDetails.previewImageUrl ? "venue layout" : "grid background"}
                >
                  <Layer>
                    {/* Render Venue Elements */}
                    {currentSelectedLayoutDetails.tables.map(table => {
                      const isCircle = table.type === 'circle';
                      const tableWidthForText = table.width;
                      const fontSizeNumber = isCircle ? FONT_SIZE_NUMBER_CIRCLE : FONT_SIZE_NUMBER_RECT;
                      const fontSizeCapacity = isCircle ? FONT_SIZE_CAPACITY_CIRCLE : FONT_SIZE_CAPACITY_RECT;
                      const numberTextHeightEstimate = fontSizeNumber;
                      const capacityTextHeightEstimate = fontSizeCapacity;
                      const totalTextContentHeight = numberTextHeightEstimate + TEXT_VERTICAL_GAP + capacityTextHeightEstimate;
                      const yPosNumberText = - (totalTextContentHeight / 2) + (numberTextHeightEstimate / 2);
                      const yPosCapacityText = (totalTextContentHeight / 2) - (capacityTextHeightEstimate / 2);
                      const textBlockRenderHeightNumber = fontSizeNumber * 1.5;
                      const textBlockRenderHeightCapacity = fontSizeCapacity * 1.5;

                      return (
                        <Group key={table.id} id={table.id} x={table.x} y={table.y} rotation={table.rotation} offsetX={0} offsetY={0}>
                          {table.type === 'rect' ? (
                            <KonvaRect x={-table.width / 2} y={-table.height / 2} width={table.width} height={table.height} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={1.5} cornerRadius={4} shadowBlur={3} shadowOpacity={0.2} shadowOffsetX={1} shadowOffsetY={1} listening={false} />
                          ) : (
                            <KonvaCircle radius={table.radius} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={1.5} shadowBlur={3} shadowOpacity={0.2} shadowOffsetX={1} shadowOffsetY={1} listening={false} />
                          )}
                          {table.chairs.map(chair => {
                            const assignment = seatingAssignments[chair.id];
                            const guestInitials = assignment ? assignment.guestName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';
                            return (
                              <Group
                                key={chair.id}
                                id={chair.id}
                                name="chair-group" // Used to identify chair group on drop
                                x={chair.x}
                                y={chair.y}
                                listening={true} // Ensure group is listening for events
                                onClick={() => { if (assignment) unassignGuestFromChair(chair.id); }}
                                onTap={() => { if (assignment) unassignGuestFromChair(chair.id); }}
                                onMouseEnter={(e) => {
                                  const currentAssignment = seatingAssignments[chair.id];
                                  if (currentAssignment) {
                                    const stage = e.target.getStage();
                                    const pointerPosition = stage?.getPointerPosition();
                                    if (pointerPosition) {
                                      setHoveredChairInfo({
                                        guestName: currentAssignment.guestName,
                                        x: pointerPosition.x + 15, // Offset tooltip slightly
                                        y: pointerPosition.y - 15,
                                      });
                                    }
                                    stage?.container().style.setProperty('cursor', 'pointer');
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  setHoveredChairInfo(null);
                                  e.target.getStage()?.container().style.setProperty('cursor', 'default');
                                }}
                                onDragOver={(e) => e.evt.preventDefault()} // Allow drop
                                onDragEnter={(e) => e.evt.preventDefault()} // Allow drop
                                onDrop={(e) => {
                                   e.evt.preventDefault(); // Prevent default drop behavior
                                   if (draggedGuestInfo) handleDropOnChair(chair.id);
                                }}
                              >
                                <KonvaCircle
                                  radius={CHAIR_RADIUS}
                                  fill={assignment ? ASSIGNED_CHAIR_FILL : "#f5f5f5"}
                                  stroke={assignment ? CHAIR_TEXT_COLOR : "#a1887f"}
                                  strokeWidth={1}
                                  shadowBlur={assignment ? 2 : 0}
                                  shadowOpacity={assignment ? 0.5 : 0}
                                  shadowColor={assignment ? CHAIR_TEXT_COLOR : undefined}
                                />
                                {assignment && (
                                  <Text
                                    text={guestInitials}
                                    fontSize={CHAIR_RADIUS * 0.8} // Scale font to chair size
                                    fill={CHAIR_TEXT_COLOR}
                                    align="center"
                                    verticalAlign="middle"
                                    width={CHAIR_RADIUS * 2}
                                    height={CHAIR_RADIUS * 2}
                                    offsetX={CHAIR_RADIUS} // Center text
                                    offsetY={CHAIR_RADIUS} // Center text
                                    listening={false} // Text itself doesn't need to listen for events
                                    fontStyle="bold"
                                  />
                                )}
                              </Group>
                            );
                          })}
                          {/* Table Number/Label */}
                          {table.label ? (
                            <Text text={table.label} fontSize={fontSizeNumber} fill="#3e2723" fontStyle="bold" x={0} y={0} width={tableWidthForText} height={textBlockRenderHeightNumber} align="center" verticalAlign="middle" listening={false} offsetX={tableWidthForText / 2} />
                          ) : (
                            <>
                              <Text text={`#${table.displayOrderNumber}`} fontSize={fontSizeNumber} fill="#3e2723" fontStyle="bold" x={0} y={yPosNumberText} width={tableWidthForText} height={textBlockRenderHeightNumber} align="center" verticalAlign="middle" listening={false} offsetX={tableWidthForText / 2} />
                              <Text text={`(${table.capacity}pp)`} fontSize={fontSizeCapacity} fill="#5d4037" x={0} y={yPosCapacityText} width={tableWidthForText} height={textBlockRenderHeightCapacity} align="center" verticalAlign="middle" listening={false} offsetX={tableWidthForText / 2} />
                            </>
                          )}
                        </Group>
                      );
                    })}
                    {/* Tooltip Label */}
                    {hoveredChairInfo && (
                      <KonvaLabel x={hoveredChairInfo.x} y={hoveredChairInfo.y} opacity={0.9}>
                        <KonvaTag
                          fill="black"
                          pointerDirection="none" // Simpler tag, or adjust as needed
                          lineJoin="round"
                          shadowColor="black"
                          shadowBlur={5}
                          shadowOpacity={0.3}
                          cornerRadius={4}
                        />
                        <Text
                          text={hoveredChairInfo.guestName}
                          fontFamily="Arial, sans-serif"
                          fontSize={12}
                          padding={6}
                          fill="white"
                        />
                      </KonvaLabel>
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Render layout selection screen if no layout is selected for the wedding
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
      {/* Search and Action Buttons */}
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
          <Button variant="outline" disabled> {/* Disabled for now */}
            <ExternalLink className="mr-2 h-4 w-4" /> Request from Venue (Soon)
          </Button>
          <Button asChild>
            <Link href="/dashboard/seating/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Layout
            </Link>
          </Button>
        </div>
      </div>

      {/* Display if a layout is already selected for the wedding */}
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

      {/* Layout Cards */}
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
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={layout.dataAiHint || "venue layout"}
                  />
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
                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                      <Link href={`/dashboard/seating/edit/${layout.id}`}>
                        <Edit className="mr-1.5 h-3 w-3" /> Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setLayoutToDelete(layout)}>
                          <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      {layoutToDelete && layoutToDelete.id === layout.id && (
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
                            <AlertDialogAction onClick={handleDeleteLayout} disabled={isDeletingLayout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {isDeletingLayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Delete Layout
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
