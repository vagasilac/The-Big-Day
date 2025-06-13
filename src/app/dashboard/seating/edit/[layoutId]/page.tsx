
'use client';

import React, { useEffect, useState, ChangeEvent, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Konva from 'konva';
import { Stage, Layer, Rect as KonvaRect, Circle as KonvaCircle, Group, Line, Text as KonvaText, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';

import { ArrowLeft, Save, Loader2, Trash2, LayoutGrid as LayoutGridIcon, Square, Circle as CircleIcon, Candy, CupSoda, Presentation, Footprints, Shapes } from 'lucide-react';

import { auth, db, storage } from '@/lib/firebase-config';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject as deleteFileObject } from "firebase/storage"; // Renamed to avoid conflict

import type { VenueLayout, TableElement as StoredTableElement, Chair as StoredChair } from '@/types/venue'; // Use Stored types for clarity
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent as KonvaDialogContent, // Alias to avoid clash with AlertDialogContent
  DialogHeader as KonvaDialogHeader,
  DialogTitle as KonvaDialogTitle,
  DialogDescription as KonvaDialogDescription,
  DialogFooter as KonvaDialogFooter,
  DialogClose as KonvaDialogClose,
} from '@/components/ui/dialog'; // For Konva editor dialogs
import { cn } from '@/lib/utils';


// Konva Editor specific types (can be moved to a separate file later if needed)
interface Chair {
  id: string;
  x: number;
  y: number;
}

interface TableElement {
  id:string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  rotation: number;
  capacity: number;
  chairs: Chair[];
  displayOrderNumber: number;
  label?: string;
}

const FONT_SIZE_NUMBER_RECT = 14;
const FONT_SIZE_CAPACITY_RECT = 10;
const FONT_SIZE_NUMBER_CIRCLE = 16;
const FONT_SIZE_CAPACITY_CIRCLE = 12;
const TEXT_VERTICAL_GAP = 4;
const CHAIR_RADIUS = 8;
const CHAIR_SPACING_FROM_TABLE = 10;
const CHAIR_CORNER_MARGIN = 5;

// Helper to ensure Timestamps are converted for layout details
const ensureDateFields = (data: any): VenueLayout => {
  const convertTimestamp = (ts: any) => ts?.toDate ? ts.toDate().toISOString() : ts;
  return {
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as VenueLayout;
};

// Konva Editor Helper functions
const getChairSnapSide = (
  chairX: number, 
  chairY: number, 
  tableWidth: number,
  tableHeight: number
): 'top' | 'bottom' | 'left' | 'right' => {
  const halfWidth = tableWidth / 2;
  const halfHeight = tableHeight / 2;

  const distTop = Math.abs(chairY - (-halfHeight - CHAIR_SPACING_FROM_TABLE - CHAIR_RADIUS));
  const distBottom = Math.abs(chairY - (halfHeight + CHAIR_SPACING_FROM_TABLE + CHAIR_RADIUS));
  const distLeft = Math.abs(chairX - (-halfWidth - CHAIR_SPACING_FROM_TABLE - CHAIR_RADIUS));
  const distRight = Math.abs(chairX - (halfWidth + CHAIR_SPACING_FROM_TABLE + CHAIR_RADIUS));

  let minDistance = distTop;
  let side: 'top' | 'bottom' | 'left' | 'right' = 'top';

  if (distBottom < minDistance) {
    minDistance = distBottom;
    side = 'bottom';
  }
  if (distLeft < minDistance) {
    minDistance = distLeft;
    side = 'left';
  }
  if (distRight < minDistance) { 
    minDistance = distRight; 
    side = 'right';
  }
  return side;
};

const alignChairsOnTable = (table: TableElement): Chair[] => {
    const alignedChairs: Chair[] = [];
    const { type, width, height, radius, chairs: currentChairs, capacity } = table;

    if (capacity === 0) return [];

    if (type === 'rect') {
        const chairsBySide: { top: Chair[]; bottom: Chair[]; left: Chair[]; right: Chair[] } = {
            top: [], bottom: [], left: [], right: []
        };
        
        currentChairs.forEach(c => {
            const side = getChairSnapSide(c.x, c.y, width, height);
            chairsBySide[side].push(c);
        });

        (['top', 'bottom', 'left', 'right'] as const).forEach(sideKey => {
            const sideChairs = chairsBySide[sideKey];
            const numChairsOnThisSide = sideChairs.length;
            if (numChairsOnThisSide === 0) return;

            sideChairs.sort((a, b) => {
                if (sideKey === 'top' || sideKey === 'bottom') return a.x - b.x;
                return a.y - b.y;
            });
            
            const primaryLengthOfSide = (sideKey === 'top' || sideKey === 'bottom') ? width : height;
            const effectiveDistributableLength = primaryLengthOfSide - (2 * CHAIR_RADIUS) - (2 * CHAIR_CORNER_MARGIN);

            sideChairs.forEach((chair, index) => {
                let finalX = 0;
                let finalY = 0;
                let variableCoordinate: number;

                if (numChairsOnThisSide === 1) {
                    variableCoordinate = 0;
                } else if (effectiveDistributableLength <= 0) {
                    variableCoordinate = 0;
                } else {
                    variableCoordinate = (index * (effectiveDistributableLength / (numChairsOnThisSide - 1))) - (effectiveDistributableLength / 2);
                }

                switch (sideKey) {
                    case 'top':
                        finalY = -height / 2 - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
                        finalX = variableCoordinate;
                        break;
                    case 'bottom':
                        finalY = height / 2 + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
                        finalX = variableCoordinate;
                        break;
                    case 'left':
                        finalX = -width / 2 - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
                        finalY = variableCoordinate;
                        break;
                    case 'right':
                        finalX = width / 2 + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
                        finalY = variableCoordinate;
                        break;
                }
                alignedChairs.push({ ...chair, id: chair.id || uuidv4(), x: finalX, y: finalY });
            });
        });
        return alignedChairs;

    } else if (type === 'circle' && radius) {
      for (let i = 0; i < capacity; i++) {
        const angle = (2 * Math.PI * i) / capacity;
        alignedChairs.push({ 
          id: currentChairs[i]?.id || uuidv4(), 
          x: Math.cos(angle) * (radius + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE), 
          y: Math.sin(angle) * (radius + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE) 
        });
      }
      return alignedChairs.slice(0, capacity);
    }
    return currentChairs; 
};

const chairDragBoundFunc = (
  pos: Konva.Vector2d,
  tableWidth: number,
  tableHeight: number,
  tableTransform: Konva.Transform
): Konva.Vector2d => {
    const tableHalfWidth = tableWidth / 2;
    const tableHalfHeight = tableHeight / 2;

    const inverted = tableTransform.copy().invert();
    const localPos = inverted.point(pos);

    const trackTopY = -tableHalfHeight - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
    const trackBottomY = tableHalfHeight + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
    const trackLeftX = -tableHalfWidth - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
    const trackRightX = tableHalfWidth + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;

    const targetSide = getChairSnapSide(localPos.x, localPos.y, tableWidth, tableHeight);

    let newLocalX = localPos.x;
    let newLocalY = localPos.y;

    const effectiveWidthForChairs = tableWidth - 2 * CHAIR_CORNER_MARGIN - 2 * CHAIR_RADIUS;
    const effectiveHeightForChairs = tableHeight - 2 * CHAIR_CORNER_MARGIN - 2 * CHAIR_RADIUS;

    switch (targetSide) {
        case 'top':
            newLocalY = trackTopY;
            newLocalX = effectiveWidthForChairs <= 0 ? 0 : Math.max(-effectiveWidthForChairs / 2, Math.min(effectiveWidthForChairs / 2, newLocalX));
            break;
        case 'bottom':
            newLocalY = trackBottomY;
            newLocalX = effectiveWidthForChairs <= 0 ? 0 : Math.max(-effectiveWidthForChairs / 2, Math.min(effectiveWidthForChairs / 2, newLocalX));
            break;
        case 'left':
            newLocalX = trackLeftX;
            newLocalY = effectiveHeightForChairs <= 0 ? 0 : Math.max(-effectiveHeightForChairs / 2, Math.min(effectiveHeightForChairs / 2, newLocalY));
            break;
        case 'right':
            newLocalX = trackRightX;
            newLocalY = effectiveHeightForChairs <= 0 ? 0 : Math.max(-effectiveHeightForChairs / 2, Math.min(effectiveHeightForChairs / 2, newLocalY));
            break;
    }
    return tableTransform.point({ x: newLocalX, y: newLocalY });
};


export default function EditVenueLayoutPage() {
  const params = useParams<{ layoutId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  // State for Details Tab
  const [layout, setLayout] = useState<VenueLayout | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null); 
  const [currentPreviewImageUrl, setCurrentPreviewImageUrl] = useState<string | null>(null);
  const [dataAiHint, setDataAiHint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // State for Editor Tab
  const [editorTables, setEditorTables] = useState<TableElement[]>([]);
  const [venueShape, setVenueShape] = useState<number[]>([]); // Future use
  const [isGuestNumberDialogOpen, setIsGuestNumberDialogOpen] = useState(false);
  const [tableTypeToAdd, setTableTypeToAdd] = useState<'rect' | 'square' | 'circle' | null>(null);
  const [guestCountInput, setGuestCountInput] = useState<string>("8");
  const [isEditTableNumberDialogOpen, setIsEditTableNumberDialogOpen] = useState(false);
  const [editingTableIdForNumber, setEditingTableIdForNumber] = useState<string | null>(null);
  const [newTableNumberInput, setNewTableNumberInput] = useState<string>("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const tableNodeRefs = useRef<Map<string, Konva.Group>>(new Map());
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [isAddElementDialogOpen, setIsAddElementDialogOpen] = useState(false);
  const [newElementLabel, setNewElementLabel] = useState<string>("");
  const [isSavingStructure, setIsSavingStructure] = useState(false);
  const [stageDimensions, setStageDimensions] = React.useState({ width: 800, height: 600 });
  const editorCanvasContainerRef = useRef<HTMLDivElement>(null);


  const layoutId = params.layoutId;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        router.push('/auth');
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchLayout = async () => {
      if (!layoutId || !currentUserId) {
        if (!layoutId && !isLoading) setIsLoading(false); 
        return;
      }
      setIsLoading(true);
      try {
        const docRef = doc(db, 'venueLayouts', layoutId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = ensureDateFields(snap.data()) as VenueLayout;
           if (data.ownerId !== currentUserId) {
            toast({ title: 'Access Denied', description: 'You do not own this layout.', variant: 'destructive' });
            router.push('/dashboard/seating');
            return;
          }
          setLayout(data);
          // Details tab state
          setLayoutName(data.name);
          setLayoutDescription(data.description || '');
          setIsPublic(data.isPublic || false);
          setCurrentPreviewImageUrl(data.previewImageUrl || null);
          setPreviewImageUrl(data.previewImageUrl || null); 
          setDataAiHint(data.dataAiHint || '');
          // Editor tab state
          setEditorTables(data.tables || []);
          setVenueShape(data.venueShape || []);

        } else {
          toast({ title: 'Not Found', description: 'Venue layout does not exist.', variant: 'destructive' });
          router.push('/dashboard/seating');
        }
      } catch (error: any) {
        console.error('Error fetching layout', error);
        toast({ title: 'Error', description: 'Unable to fetch layout details.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    if (layoutId && currentUserId) {
        fetchLayout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutId, currentUserId, router, toast]); 


  // Details Tab Functions
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImageFile(null);
      setPreviewImageUrl(currentPreviewImageUrl); 
    }
  };
  
  const handleRemovePreviewImage = async () => {
    let imagePathToDelete: string | null = null;
    if (previewImageFile) { 
        setPreviewImageFile(null);
        setPreviewImageUrl(currentPreviewImageUrl); 
        return;
    }
    if (currentPreviewImageUrl && layout?.previewImageUrl === currentPreviewImageUrl) {
        imagePathToDelete = currentPreviewImageUrl;
    }

    if (imagePathToDelete) {
        setIsUploading(true); 
        try {
            const imageStorageRef = storageRef(storage, imagePathToDelete);
            await deleteFileObject(imageStorageRef);
            toast({ title: 'Image Removed', description: 'Preview image removed from storage.' });
            
            const docRef = doc(db, 'venueLayouts', layoutId);
            await updateDoc(docRef, {
              previewImageUrl: '', 
              updatedAt: serverTimestamp()
            });
            setCurrentPreviewImageUrl(null);
            setPreviewImageUrl(null);
            if(layout) setLayout({...layout, previewImageUrl: undefined });

        } catch (error: any) {
            console.error("Error removing image from storage: ", error);
            if (error.code === 'storage/object-not-found') {
                 toast({ title: 'Info', description: 'Image already removed from storage or not found. Updated record.', variant: 'default' });
                 const docRef = doc(db, 'venueLayouts', layoutId);
                 await updateDoc(docRef, {
                    previewImageUrl: '',
                    updatedAt: serverTimestamp()
                });
                setCurrentPreviewImageUrl(null);
                setPreviewImageUrl(null);
                if(layout) setLayout({...layout, previewImageUrl: undefined });
            } else {
                toast({ title: 'Removal Failed', description: 'Could not remove preview image: ' + error.message, variant: 'destructive' });
            }
        } finally {
            setIsUploading(false);
        }
    } else {
        setPreviewImageUrl(null);
    }
  };

  const handleSaveDetails = async () => {
    if (!layout || !layoutId || !currentUserId) {
      toast({ title: 'Error', description: 'Layout data or user session missing.', variant: 'destructive' });
      return;
    }
    if (layout.ownerId !== currentUserId) {
      toast({ title: 'Permission Denied', description: 'You do not have permission to update this layout.', variant: 'destructive' });
      return;
    }
    if (!layoutName.trim()) {
      toast({ title: 'Name Required', description: 'Please provide a layout name.', variant: 'destructive' });
      return;
    }
    setIsSavingDetails(true);
    setIsUploading(false);

    let finalImageUrl = currentPreviewImageUrl; 

    if (previewImageFile) {
      setIsUploading(true);
      try {
        const filePath = `venue_layout_previews/${currentUserId}/${layoutId}/${Date.now()}-${previewImageFile.name}`;
        const fileStorageRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, previewImageFile);

        finalImageUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed', (snapshot) => {}, (error) => reject(error),
            async () => {
              try { const downloadURL = await getDownloadURL(uploadTask.snapshot.ref); resolve(downloadURL); }
              catch (error) { reject(error); }
            }
          );
        });
        setCurrentPreviewImageUrl(finalImageUrl);
        setPreviewImageFile(null); 
        toast({ title: 'Image Uploaded', description: 'Preview image updated successfully.' });
      } catch (error: any) {
        console.error('Error uploading preview image:', error);
        toast({ title: 'Image Upload Failed', description: 'Could not upload preview image. ' + error.message, variant: 'destructive' });
        setIsUploading(false);
        setIsSavingDetails(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (previewImageUrl === null && currentPreviewImageUrl !== null) {
      finalImageUrl = ''; 
    }

    try {
      const docRef = doc(db, 'venueLayouts', layoutId);
      const dataToUpdate: Partial<VenueLayout> = {
        name: layoutName.trim(),
        description: layoutDescription || '',
        isPublic,
        previewImageUrl: finalImageUrl || '', 
        dataAiHint: dataAiHint || '',
        updatedAt: serverTimestamp() as any, 
      };

      await updateDoc(docRef, dataToUpdate);
      toast({ title: 'Layout Details Updated', description: 'Changes saved successfully.' });
      // Optionally, refetch layout to update the main layout state if needed, or merge locally
      setLayout(prev => prev ? {...prev, ...dataToUpdate, name: layoutName.trim()} : null);

    } catch (error: any) {
      console.error('Error updating layout details', error);
      toast({ title: 'Save Failed', description: error.message || 'Failed to update layout details.', variant: 'destructive' });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleDeleteLayout = async () => {
    if (!layoutId || !currentUserId || !layout || layout.ownerId !== currentUserId) return;
    setIsSavingDetails(true); // Use isSavingDetails to disable delete button too
    try {
        if (layout.previewImageUrl) {
            try {
                const imageStorageRef = storageRef(storage, layout.previewImageUrl);
                await deleteFileObject(imageStorageRef);
            } catch (imgError: any) {
                console.warn("Could not delete preview image from storage:", imgError);
            }
        }
        await deleteDoc(doc(db, 'venueLayouts', layoutId));
        toast({ title: 'Layout Deleted', description: `Layout "${layoutName || layout.name}" was successfully deleted.`});
        router.push('/dashboard/seating');
    } catch (error: any) {
        toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
        setIsSavingDetails(false); 
    }
  };

  // Editor Tab Functions
  const generateInitialChairs = useCallback((tableBase: Omit<TableElement, 'id' | 'chairs' | 'displayOrderNumber' | 'rotation'>): Chair[] => {
    const capacity = tableBase.capacity;
    if (capacity <= 0) return [];
    const dummyTable: TableElement = {
        ...tableBase, id: 'dummy', chairs: Array(capacity).fill(null).map(() => ({ id: uuidv4(), x: 0, y: 0 })),
        displayOrderNumber: 0, rotation: 0,
    };
    return alignChairsOnTable(dummyTable);
  }, []);

  const openGuestNumberDialog = (type: 'rect' | 'square' | 'circle') => {
    setTableTypeToAdd(type);
    setGuestCountInput(type === 'circle' ? "6" : type === 'square' ? "4" : "8");
    setIsGuestNumberDialogOpen(true);
  };

  const handleConfirmAddTable = () => {
    const cap = parseInt(guestCountInput, 10) || 0;
    if (cap <= 0) {
        toast({ title: "Invalid Capacity", description: "Table capacity must be greater than 0.", variant: "destructive"});
        setIsGuestNumberDialogOpen(false);
        return;
    }
    let newTableBase: Omit<TableElement, 'id' | 'chairs' | 'displayOrderNumber' | 'rotation'>;
    const initialX = (stageDimensions.width / 2) + Math.random() * 20 - 10;
    const initialY = (stageDimensions.height / 2) + Math.random() * 20 - 10;
    const displayOrderNumber = editorTables.length + 1;

    if (tableTypeToAdd === 'rect') {
      newTableBase = { type: 'rect', x: initialX, y: initialY, width: 120, height: 60, capacity: cap };
    } else if (tableTypeToAdd === 'square') {
      newTableBase = { type: 'rect', x: initialX, y: initialY, width: 80, height: 80, capacity: cap };
    } else if (tableTypeToAdd === 'circle') {
      newTableBase = { type: 'circle', x: initialX, y: initialY, width: 100, height: 100, radius: 50, capacity: cap };
    } else return;
    
    const chairs = generateInitialChairs(newTableBase);
    const newTable: TableElement = { ...newTableBase, id: uuidv4(), chairs, displayOrderNumber, rotation: 0 };
    setEditorTables(t => [...t, newTable]);
    setIsGuestNumberDialogOpen(false);
    setTableTypeToAdd(null);
  };

  const addEditorElement = (label: string, opts: { type?: 'rect' | 'circle'; width?: number; height?: number; radius?: number }) => {
    const initialX = stageDimensions.width / 2 + Math.random() * 20 - 10;
    const initialY = stageDimensions.height / 2 + Math.random() * 20 - 10;
    const base: Omit<TableElement, 'id' | 'chairs' | 'displayOrderNumber' | 'rotation'> = {
      type: opts.type ?? 'rect', x: initialX, y: initialY,
      width: opts.width ?? (opts.radius ? opts.radius * 2 : 80),
      height: opts.height ?? (opts.radius ? opts.radius * 2 : 80),
      radius: opts.radius, capacity: 0,
    };
    const newElement: TableElement = { ...base, id: uuidv4(), chairs: [], displayOrderNumber: editorTables.length + 1, rotation: 0, label };
    setEditorTables(t => [...t, newElement]);
  };

  const handleAddCustomElement = () => {
    if (!newElementLabel.trim()) return;
    addEditorElement(newElementLabel.trim(), { type: 'rect', width: 80, height: 80 });
    setNewElementLabel('');
    setIsAddElementDialogOpen(false);
  };
  const addCandyBar = () => addEditorElement('Candy Bar', { type: 'rect', width: 100, height: 50 });
  const addChocolateFountain = () => addEditorElement('Chocolate Fountain', { type: 'circle', radius: 40 });
  const addStage = () => addEditorElement('Stage', { type: 'rect', width: 250, height: 120 });
  const addDanceFloor = () => addEditorElement('Dance Floor', { type: 'rect', width: 200, height: 200 });

  const handleDeleteSelected = () => {
    if (!selectedTableId) return;
    setEditorTables(prev => prev.filter(t => t.id !== selectedTableId));
    setSelectedTableId(null);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (e.target === stage || e.target.getParent() === stage) { setSelectedTableId(null); return; }
    const isTransformer = e.target.getClassName() === 'Transformer' || e.target.getParent()?.getClassName() === 'Transformer';
    if (isTransformer) return;
    let node = e.target;
    while (node && node !== stage) {
        const nodeId = node.id();
        if (node instanceof Konva.Group && typeof nodeId === 'string' && editorTables.some(t => t.id === nodeId)) {
            setSelectedTableId(nodeId); return;
        }
        node = node.getParent();
    }
    setSelectedTableId(null);
  };

  const handleTableDblClick = (tableId: string) => {
    const tableToEdit = editorTables.find(t => t.id === tableId);
    if (tableToEdit && tableToEdit.capacity > 0 && !tableToEdit.label) {
      setEditingTableIdForNumber(tableId);
      setNewTableNumberInput(tableToEdit.displayOrderNumber.toString());
      setIsEditTableNumberDialogOpen(true);
    }
  };

  const handleSaveTableNumber = () => {
    if (!editingTableIdForNumber) return;
    const newNumber = parseInt(newTableNumberInput, 10);
    if (isNaN(newNumber) || newNumber < 1) {
      toast({ title: "Invalid Table Number", description: "Please enter a positive number.", variant: "destructive" }); return;
    }
    const maxAllowedNumber = editorTables.length;
    if (newNumber > maxAllowedNumber && editorTables.some(t => t.displayOrderNumber === newNumber && t.id !== editingTableIdForNumber)) {
      toast({ title: "Invalid Table Number", description: `Please enter a number between 1 and ${maxAllowedNumber} if swapping.`, variant: "destructive" }); return;
    }
    const tableA = editorTables.find(t => t.id === editingTableIdForNumber);
    if (!tableA) return;
    const currentDisplayNumberOfTableA = tableA.displayOrderNumber;
    if (newNumber === currentDisplayNumberOfTableA) { setIsEditTableNumberDialogOpen(false); return; }
    const tableB = editorTables.find(t => t.displayOrderNumber === newNumber && t.id !== editingTableIdForNumber);
    setEditorTables(prevTables => 
      prevTables.map(t => {
        if (t.id === editingTableIdForNumber) return { ...t, displayOrderNumber: newNumber };
        if (tableB && t.id === tableB.id) return { ...t, displayOrderNumber: currentDisplayNumberOfTableA };
        return t;
      })
    );
    toast({ title: "Table Number Updated" });
    setIsEditTableNumberDialogOpen(false);
    setEditingTableIdForNumber(null);
  };

  useEffect(() => {
    const updateDimensions = () => {
      const editorElement = editorCanvasContainerRef.current;
      if (editorElement) {
        setStageDimensions({
          width: editorElement.offsetWidth > 0 ? editorElement.offsetWidth -2 : (typeof window !== 'undefined' ? window.innerWidth - 280 - 50: 800),
          height: editorElement.offsetHeight > 0 ? editorElement.offsetHeight -2 : (typeof window !== 'undefined' ? window.innerHeight - 250 : 600),
        });
      } else if (typeof window !== 'undefined') {
         setStageDimensions({
            width: window.innerWidth > 330 ? window.innerWidth - 280 -50 : 800, 
            height: window.innerHeight > 250 ? window.innerHeight - 250 : 600 
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const robserver = new ResizeObserver(updateDimensions);
    if (editorCanvasContainerRef.current) robserver.observe(editorCanvasContainerRef.current);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (editorCanvasContainerRef.current) robserver.unobserve(editorCanvasContainerRef.current);
    }
  }, []);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return; 
    if (selectedTableId) {
      const selectedNode = tableNodeRefs.current.get(selectedTableId);
      if (selectedNode) {
        tr.nodes([selectedNode]);
        const table = editorTables.find(t => t.id === selectedTableId);
        if (table?.type === 'circle') { tr.keepRatio(true); tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']); }
        else { tr.keepRatio(false); tr.enabledAnchors(undefined); }
        tr.rotateEnabled(true); tr.visible(true); 
      } else { tr.nodes([]); tr.visible(false); }
    } else { tr.nodes([]); tr.visible(false); }
    tr.getLayer()?.batchDraw(); 
  }, [selectedTableId, editorTables]); 

  const handleChairDragEnd = (e: Konva.KonvaEventObject<DragEvent>, tableId: string, chairId: string) => {
    const draggedChairRawX = e.target.x(); const draggedChairRawY = e.target.y();
    setEditorTables(prevTables => {
        const tableIndex = prevTables.findIndex(t => t.id === tableId);
        if (tableIndex === -1) return prevTables;
        const table = prevTables[tableIndex];
        const tempChairsWithDraggedPos = table.chairs.map(chair => chair.id === chairId ? { ...chair, x: draggedChairRawX, y: draggedChairRawY } : chair);
        const realignedChairs = alignChairsOnTable({ ...table, chairs: tempChairsWithDraggedPos });
        const newTables = [...prevTables];
        newTables[tableIndex] = { ...table, chairs: realignedChairs };
        return newTables;
    });
  };

  const handleSaveLayoutStructure = async () => {
    if (!layoutId || !currentUserId || !layout) {
      toast({ title: "Error", description: "Layout data or user session missing.", variant: "destructive" }); return;
    }
    if (layout.ownerId !== currentUserId) {
      toast({ title: "Permission Denied", description: "You do not have permission to update this layout structure.", variant: "destructive" }); return;
    }
    setIsSavingStructure(true);
    const totalCapacity = editorTables.reduce((sum, table) => sum + table.capacity, 0);
    const tablesToStore: StoredTableElement[] = editorTables.map(currentTable => {
      const tableData: Partial<StoredTableElement> = { ...currentTable, chairs: currentTable.chairs.map(chair => ({ ...chair } as StoredChair)) };
      if (currentTable.type === 'circle' && typeof currentTable.radius === 'number') tableData.radius = currentTable.radius;
      else delete tableData.radius;
      return tableData as StoredTableElement;
    });

    try {
      const docRef = doc(db, 'venueLayouts', layoutId);
      await updateDoc(docRef, {
        tables: tablesToStore,
        venueShape: venueShape.length > 0 ? venueShape : [],
        totalCapacity,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Layout Structure Updated', description: 'The visual layout has been saved.' });
      setLayout(prev => prev ? { ...prev, tables: tablesToStore, totalCapacity } : null);
    } catch (error: any) {
      console.error('Error saving layout structure:', error);
      toast({ title: 'Save Failed', description: error.message || 'Could not save layout structure.', variant: 'destructive' });
    } finally {
      setIsSavingStructure(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-2xl text-center">
        <p className="text-xl text-muted-foreground">Venue layout not found or you don&apos;t have permission to view it.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/seating">Go back to Seating</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-5xl space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/seating">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Seating</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {`Edit Layout: ${layout ? layout.name : (isLoading ? 'Loading name...' : 'Details')}`}
          </h1>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="editor">Visual Editor</TabsTrigger>
        </TabsList>

        {/* Details Tab Content */}
        <TabsContent value="details">
          <Card className="shadow-lg mt-4">
            <CardHeader>
              <CardTitle>Layout Configuration</CardTitle>
              <CardDescription>Update the details and preview image for this venue layout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="layout-name" className="block text-sm font-medium mb-1">Layout Name</Label>
                <Input id="layout-name" value={layoutName} onChange={(e) => setLayoutName(e.target.value)} placeholder="e.g., Grand Ballroom - Wedding Setup"/>
              </div>
              <div>
                <Label htmlFor="layout-desc" className="block text-sm font-medium mb-1">Description (Optional)</Label>
                <Textarea id="layout-desc" value={layoutDescription} onChange={(e) => setLayoutDescription(e.target.value)} placeholder="Notes about this layout, capacity details, etc."/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-image-upload" className="block text-sm font-medium">Preview Image (Optional)</Label>
                <div className="w-full max-w-xs h-40 relative bg-secondary rounded-md overflow-hidden border border-dashed flex items-center justify-center">
                    {previewImageUrl ? (<Image src={previewImageUrl} alt="Layout preview" layout="fill" objectFit="contain" />) : 
                    (<div className="text-center text-muted-foreground p-2"><LayoutGridIcon className="mx-auto h-10 w-10" /><p className="text-xs mt-1">No preview image.</p></div>)}
                </div>
                <Input id="preview-image-upload" type="file" accept="image/*" className="block w-full max-w-xs text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={handleFileChange} disabled={isUploading}/>
                {previewImageUrl && (<Button type="button" variant="ghost" size="sm" onClick={handleRemovePreviewImage} className="text-destructive hover:text-destructive text-xs disabled:opacity-50" disabled={isUploading || isSavingDetails}><Trash2 className="mr-1.5 h-3 w-3" /> Remove Preview Image</Button>)}
                 <p className="text-xs text-muted-foreground">Upload an image to represent this layout (e.g., a screenshot or diagram).</p>
              </div>
              <div>
                <Label htmlFor="data-ai-hint" className="block text-sm font-medium mb-1">Image Search Hint (Optional)</Label>
                <Input id="data-ai-hint" value={dataAiHint} onChange={(e) => setDataAiHint(e.target.value)} placeholder="e.g., ballroom diagram, restaurant floorplan"/>
                <p className="text-xs text-muted-foreground mt-1">One or two keywords for AI-assisted image search if no preview is uploaded.</p>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="is-public" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked as boolean)} disabled={!layout || layout.ownerId !== currentUserId}/>
                <Label htmlFor="is-public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Make this layout a public template</Label>
              </div>
              <p className="text-xs text-muted-foreground">Public templates can be used by other users. This is typically for venue-provided or generic layouts.</p>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveDetails} disabled={isSavingDetails || isUploading}>
                  {(isSavingDetails || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} <Save className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading Image...' : isSavingDetails ? 'Saving Details...' : 'Save Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg mt-8">
            <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
            <CardContent>
                 <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" disabled={!layout || layout.ownerId !== currentUserId || isSavingDetails || isUploading}><Trash2 className="mr-2 h-4 w-4" /> Delete This Layout</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the <strong> {layoutName || (layout ? layout.name : 'this layout')}</strong> and all its associated data. If this layout is currently selected for any wedding, that selection will be cleared.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLayout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSavingDetails}>
                            {isSavingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Yes, delete it
                        </AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground mt-2">Deleting a layout is permanent. Consider if this layout is used or might be needed in the future.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editor Tab Content */}
        <TabsContent value="editor">
          <div className="flex flex-col gap-4 md:gap-6 mt-4 h-[calc(100vh-20rem)]"> {/* Adjust height as needed */}
            <div className="flex items-center justify-between flex-shrink-0">
                <p className="text-sm text-muted-foreground">Visually arrange tables and elements for your venue.</p>
                <Button onClick={handleSaveLayoutStructure} disabled={isSavingStructure}>
                  {isSavingStructure ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Layout Structure
                </Button>
            </div>
            <div className="flex flex-grow gap-4 overflow-hidden">
                <Card className="w-64 flex-shrink-0 shadow-sm">
                  <CardHeader className="p-4"><CardTitle className="text-base">Tools</CardTitle></CardHeader>
                  <CardContent className="p-2 space-y-1.5">
                    <Button size="sm" className="w-full justify-start text-xs" onClick={() => openGuestNumberDialog('rect')}><Square className="mr-2 h-3 w-3" /> Add Rect Table</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={() => openGuestNumberDialog('square')}><Square className="mr-2 h-3 w-3" /> Add Square Table</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={() => openGuestNumberDialog('circle')}><CircleIcon className="mr-2 h-3 w-3" /> Add Round Table</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={addCandyBar}><Candy className="mr-2 h-3 w-3" /> Add CandyBar</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={addChocolateFountain}><CupSoda className="mr-2 h-3 w-3" /> Add Chocolate Fountain</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={() => setIsAddElementDialogOpen(true)}><Shapes className="mr-2 h-3 w-3" /> Add Custom Element</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={addStage}><Presentation className="mr-2 h-3 w-3" /> Add Stage</Button>
                    <Button size="sm" className="w-full justify-start text-xs" onClick={addDanceFloor}><Footprints className="mr-2 h-3 w-3" /> Add Dance Floor</Button>
                    <Separator className="my-1" />
                    <Button size="sm" className="w-full justify-start text-xs" variant="destructive" onClick={handleDeleteSelected} disabled={!selectedTableId}><Trash2 className="mr-2 h-3 w-3" /> Delete Selected</Button>
                  </CardContent>
                </Card>
                <div ref={editorCanvasContainerRef} className="flex-grow relative bg-muted/30 rounded-md border border-input overflow-hidden">
                <Stage ref={stageRef} width={stageDimensions.width} height={stageDimensions.height} onMouseDown={handleStageMouseDown} className="bg-white">
                    <Layer>
                    {venueShape.length >= 4 && (<Line points={venueShape} closed stroke="#a1887f" strokeWidth={2} fill="#efebe9" listening={false} />)}
                    {editorTables.map(table => {
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
                        <Group key={table.id} id={table.id} x={table.x} y={table.y} rotation={table.rotation} draggable={true} offsetX={0} offsetY={0}
                            ref={node => { if (node) tableNodeRefs.current.set(table.id, node); else tableNodeRefs.current.delete(table.id); }}
                            onDragEnd={(e) => {
                                if (selectedTableId === table.id) return; 
                                const newTables = editorTables.map(t => t.id === table.id ? { ...t, x: e.target.x(), y: e.target.y() } : t);
                                const currentTableState = newTables.find(t => t.id === table.id);
                                if (currentTableState) { const realignedChairs = alignChairsOnTable(currentTableState); setEditorTables(newTables.map(t => t.id === table.id ? { ...t, chairs: realignedChairs } : t));}
                                else setEditorTables(newTables);
                            }}
                            onDblClick={() => handleTableDblClick(table.id)}
                            onTransformEnd={(e) => {
                                const node = e.target as Konva.Group; const scaleX = node.scaleX(); const scaleY = node.scaleY();
                                setEditorTables(prevTables => {
                                    const updatedTables = prevTables.map(t => {
                                        if (t.id === table.id) {
                                           const newWidth = t.type === 'circle' ? (t.radius || 0) * 2 * Math.max(scaleX,scaleY) : t.width * scaleX;
                                           const newHeight = t.type === 'circle' ? (t.radius || 0) * 2 * Math.max(scaleX,scaleY) : t.height * scaleY;
                                           const newRadius = t.type === 'circle' ? (t.radius || 0) * Math.max(scaleX, scaleY) : undefined;
                                           const transformedTableState = { ...t, x: node.x(), y: node.y(), rotation: node.rotation(), width: newWidth, height: newHeight, radius: newRadius };
                                           const realignedChairs = alignChairsOnTable(transformedTableState);
                                           return { ...transformedTableState, chairs: realignedChairs };
                                        } return t;
                                    }); return updatedTables;
                                });
                                node.scaleX(1); node.scaleY(1);
                            }}
                        >
                            {table.type === 'rect' ? (
                            <KonvaRect x={-table.width / 2} y={-table.height / 2} width={table.width} height={table.height} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={1.5} cornerRadius={4} shadowBlur={3} shadowOpacity={0.2} shadowOffsetX={1} shadowOffsetY={1}/>
                            ) : (
                            <KonvaCircle radius={table.radius} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={1.5} shadowBlur={3} shadowOpacity={0.2} shadowOffsetX={1} shadowOffsetY={1}/>
                            )}
                            {table.chairs.map(chair => (
                            <KonvaCircle key={chair.id} id={chair.id} x={chair.x} y={chair.y} radius={CHAIR_RADIUS} fill="#f5f5f5" stroke="#a1887f" strokeWidth={1} draggable={table.id === selectedTableId}
                                onDragStart={(e) => { e.cancelBubble = true; }}
                                onDragEnd={(e) => handleChairDragEnd(e, table.id, chair.id)}
                                dragBoundFunc={(pos) => {
                                    if (table.type === 'rect') {
                                        const tableNode = tableNodeRefs.current.get(table.id);
                                        const transform = tableNode ? tableNode.getAbsoluteTransform().copy() : new Konva.Transform();
                                        return chairDragBoundFunc(pos, table.width, table.height, transform);
                                    } return pos;
                                }}
                            />
                            ))}
                            {table.label ? (
                            <KonvaText text={table.label} fontSize={fontSizeNumber} fill="#3e2723" fontStyle="bold" x={0} y={0} width={tableWidthForText} height={textBlockRenderHeightNumber} align="center" verticalAlign="middle" listening={false} offsetX={tableWidthForText / 2}/>
                            ) : (
                            <>
                                <KonvaText text={`#${table.displayOrderNumber}`} fontSize={fontSizeNumber} fill="#3e2723" fontStyle="bold" x={0} y={yPosNumberText} width={tableWidthForText} height={textBlockRenderHeightNumber} align="center" verticalAlign="middle" listening={false} offsetX={tableWidthForText / 2}/>
                                <KonvaText text={`(${table.capacity}pp)`} fontSize={fontSizeCapacity} fill="#5d4037" x={0} y={yPosCapacityText} width={tableWidthForText} height={textBlockRenderHeightCapacity} align="center" verticalAlign="middle" listening={false} offsetX={tableWidthForText / 2}/>
                            </>
                            )}
                        </Group> );
                    })}
                    <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => { if (newBox.width < 20 || newBox.height < 20) return oldBox; return newBox; }}/>
                    </Layer>
                </Stage>
                </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs for Editor Tab */}
      <KonvaDialog open={isGuestNumberDialogOpen} onOpenChange={setIsGuestNumberDialogOpen}>
        <KonvaDialogContent><KonvaDialogHeader><KonvaDialogTitle>Set Table Capacity</KonvaDialogTitle>
            <KonvaDialogDescription>How many guests will this {tableTypeToAdd} table accommodate?</KonvaDialogDescription></KonvaDialogHeader>
          <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guest-count-editor" className="text-right">Guests</Label>
              <Input id="guest-count-editor" type="number" value={guestCountInput} onChange={(e) => setGuestCountInput(e.target.value)} className="col-span-3" min="1"/>
          </div></div>
          <KonvaDialogFooter><KonvaDialogClose asChild><Button type="button" variant="outline">Cancel</Button></KonvaDialogClose>
            <Button type="button" onClick={handleConfirmAddTable}>Add Table</Button></KonvaDialogFooter>
        </KonvaDialogContent>
      </KonvaDialog>
      <KonvaDialog open={isAddElementDialogOpen} onOpenChange={setIsAddElementDialogOpen}>
        <KonvaDialogContent><KonvaDialogHeader><KonvaDialogTitle>Add Element</KonvaDialogTitle>
            <KonvaDialogDescription>Enter a label for the new element.</KonvaDialogDescription></KonvaDialogHeader>
          <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="element-label-editor" className="text-right">Label</Label>
              <Input id="element-label-editor" value={newElementLabel} onChange={(e) => setNewElementLabel(e.target.value)} className="col-span-3"/>
          </div></div>
          <KonvaDialogFooter><KonvaDialogClose asChild><Button type="button" variant="outline">Cancel</Button></KonvaDialogClose>
            <Button type="button" onClick={handleAddCustomElement}>Add</Button></KonvaDialogFooter>
        </KonvaDialogContent>
      </KonvaDialog>
      <KonvaDialog open={isEditTableNumberDialogOpen} onOpenChange={setIsEditTableNumberDialogOpen}>
        <KonvaDialogContent><KonvaDialogHeader><KonvaDialogTitle>Edit Table Number</KonvaDialogTitle>
            <KonvaDialogDescription>Enter the new number for this table. If the number is in use, tables will swap numbers.</KonvaDialogDescription></KonvaDialogHeader>
          <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-number-edit-editor" className="text-right">Table #</Label>
              <Input id="table-number-edit-editor" type="number" value={newTableNumberInput} onChange={(e) => setNewTableNumberInput(e.target.value)} className="col-span-3" min="1"/>
          </div></div>
          <KonvaDialogFooter><KonvaDialogClose asChild><Button type="button" variant="outline" onClick={() => setEditingTableIdForNumber(null)}>Cancel</Button></KonvaDialogClose>
            <Button type="button" onClick={handleSaveTableNumber}>Save Number</Button></KonvaDialogFooter>
        </KonvaDialogContent>
      </KonvaDialog>

    </div>
  );
}
