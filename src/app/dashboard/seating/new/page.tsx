
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Konva from 'konva';
import { Stage, Layer, Rect, Circle as KonvaCircle, Group, Line, Text, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Square, Circle as CircleIcon, ArrowLeft, Save, Loader2 } from 'lucide-react'; // Added Save, Loader2
import { useToast } from '@/hooks/use-toast';

import { auth, db } from '@/lib/firebase-config'; // Import auth and db
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { VenueLayout as StoredVenueLayout, TableElement as StoredTableElement, Chair as StoredChair } from '@/types/venue';


interface Chair {
  id: string;
  x: number;
  y: number;
}

interface TableElement {
  id: string;
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
}

const FONT_SIZE_NUMBER_RECT = 14;
const FONT_SIZE_CAPACITY_RECT = 10;
const FONT_SIZE_NUMBER_CIRCLE = 16;
const FONT_SIZE_CAPACITY_CIRCLE = 12;
const TEXT_VERTICAL_GAP = 4;

const CHAIR_RADIUS = 8;
const CHAIR_SPACING_FROM_TABLE = 10; 
const CHAIR_CORNER_MARGIN = 5; 


// Helper function to determine which side a chair should snap to for rectangular tables
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
  if (distRight < minDistance) { // Corrected: ensure minDistance is updated if right is closer
    minDistance = distRight; // Was missing this update
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
    return currentChairs; // Fallback
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


export default function NewLayoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tables, setTables] = useState<TableElement[]>([]);
  const [venueShape, setVenueShape] = useState<number[]>([]); // Not used for saving yet
  // const [drawingVenue, setDrawingVenue] = useState(false); // Not fully implemented

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
  
  // State for Save Layout Dialog
  const [isSaveLayoutDialogOpen, setIsSaveLayoutDialogOpen] = useState(false);
  const [layoutNameInput, setLayoutNameInput] = useState<string>("");
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const generateInitialChairs = useCallback((tableBase: Omit<TableElement, 'id' | 'chairs' | 'displayOrderNumber' | 'rotation'>): Chair[] => {
    const capacity = tableBase.capacity;
    if (capacity <= 0) return [];

    // Create a dummy table element to pass to alignChairsOnTable
    const dummyTable: TableElement = {
        ...tableBase,
        id: 'dummy', // Temporary ID
        chairs: Array(capacity).fill(null).map(() => ({ id: uuidv4(), x: 0, y: 0 })), // Placeholder chairs
        displayOrderNumber: 0, // Not relevant for initial chair generation
        rotation: 0, // Not relevant for initial chair generation
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
    const displayOrderNumber = tables.length + 1;

    if (tableTypeToAdd === 'rect') {
      const width = 120;
      const height = 60;
      newTableBase = { type: 'rect', x: initialX, y: initialY, width, height, capacity: cap };
    } else if (tableTypeToAdd === 'square') {
      const sideLength = 80;
      newTableBase = { type: 'rect', x: initialX, y: initialY, width: sideLength, height: sideLength, capacity: cap };
    } else if (tableTypeToAdd === 'circle') {
      const radius = 50;
      newTableBase = { type: 'circle', x: initialX, y: initialY, width: radius*2, height: radius*2, radius, capacity: cap };
    } else {
      return;
    }
    
    const chairs = generateInitialChairs(newTableBase);
    const newTable: TableElement = {
        ...newTableBase,
        id: uuidv4(),
        chairs,
        displayOrderNumber,
        rotation: 0,
    };

    setTables(t => [...t, newTable]);
    setIsGuestNumberDialogOpen(false);
    setTableTypeToAdd(null);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (e.target === stage || e.target.getParent() === stage) { 
        setSelectedTableId(null);
        return;
    }

    const isTransformer =
      e.target.getClassName() === 'Transformer' ||
      e.target.getParent()?.getClassName() === 'Transformer';
    if (isTransformer) {
        return;
    }

    let node = e.target;
    while (node && node !== stage) {
        const nodeId = node.id();
        if (node instanceof Konva.Group && typeof nodeId === 'string' && tables.some(t => t.id === nodeId)) {
            setSelectedTableId(nodeId);
            return;
        }
        node = node.getParent();
    }
    setSelectedTableId(null);
  };

  const handleTableDblClick = (tableId: string) => {
    const tableToEdit = tables.find(t => t.id === tableId);
    if (tableToEdit) {
      setEditingTableIdForNumber(tableId);
      setNewTableNumberInput(tableToEdit.displayOrderNumber.toString());
      setIsEditTableNumberDialogOpen(true);
    }
  };

  const handleSaveTableNumber = () => {
    if (!editingTableIdForNumber) return;

    const newNumber = parseInt(newTableNumberInput, 10);
    if (isNaN(newNumber) || newNumber < 1) {
      toast({
        title: "Invalid Table Number",
        description: `Please enter a positive number.`,
        variant: "destructive",
      });
      return;
    }
    
    const maxAllowedNumber = tables.length;
     if (newNumber > maxAllowedNumber && tables.some(t => t.displayOrderNumber === newNumber && t.id !== editingTableIdForNumber)) {
         toast({
            title: "Invalid Table Number",
            description: `Please enter a number between 1 and ${maxAllowedNumber} if swapping. To set a higher number, ensure it's unique or adjust other tables first.`,
            variant: "destructive",
        });
        return;
    }

    const tableA = tables.find(t => t.id === editingTableIdForNumber);
    if (!tableA) return;
    const currentDisplayNumberOfTableA = tableA.displayOrderNumber;
    if (newNumber === currentDisplayNumberOfTableA) {
      setIsEditTableNumberDialogOpen(false);
      return; 
    }
    const tableB = tables.find(t => t.displayOrderNumber === newNumber && t.id !== editingTableIdForNumber);

    setTables(prevTables => 
      prevTables.map(t => {
        if (t.id === editingTableIdForNumber) {
          return { ...t, displayOrderNumber: newNumber };
        }
        if (tableB && t.id === tableB.id) {
          return { ...t, displayOrderNumber: currentDisplayNumberOfTableA };
        }
        return t;
      })
    );

    toast({ title: "Table Number Updated", description: `Table #${currentDisplayNumberOfTableA} is now #${newNumber}.${tableB ? ` Original #${newNumber} is now #${currentDisplayNumberOfTableA}.` : ''}` });
    setIsEditTableNumberDialogOpen(false);
    setEditingTableIdForNumber(null);
  };


  const [stageDimensions, setStageDimensions] = React.useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const editorElement = document.getElementById('layout-editor-canvas-container');
      if (editorElement) {
        setStageDimensions({
          width: editorElement.offsetWidth > 0 ? editorElement.offsetWidth - 2 : (typeof window !== 'undefined' ? window.innerWidth - 280 : 800) , 
          height: editorElement.offsetHeight > 0 ? editorElement.offsetHeight -2 : (typeof window !== 'undefined' ? window.innerHeight - 150 : 600), 
        });
      } else if (typeof window !== 'undefined') {
         setStageDimensions({
            width: window.innerWidth > 280 ? window.innerWidth - 280 : 800, 
            height: window.innerHeight > 150 ? window.innerHeight - 150: 600 
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const robserver = new ResizeObserver(updateDimensions);
    const editorContainer = document.getElementById('layout-editor-canvas-container');
    if (editorContainer) {
        robserver.observe(editorContainer);
    }
    return () => {
        window.removeEventListener('resize', updateDimensions);
        if (editorContainer) {
            robserver.unobserve(editorContainer);
        }
    }
  }, []);


  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return; 

    if (selectedTableId) {
      const selectedNode = tableNodeRefs.current.get(selectedTableId);
      if (selectedNode) {
        tr.nodes([selectedNode]);
        const table = tables.find(t => t.id === selectedTableId);
        if (table?.type === 'circle') {
          tr.keepRatio(true);
          tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
        } else {
          tr.keepRatio(false);
          tr.enabledAnchors(undefined); 
        }
        tr.rotateEnabled(true);
        tr.visible(true); 
      } else {
        tr.nodes([]);
        tr.visible(false);
      }
    } else {
      tr.nodes([]);
      tr.visible(false);
    }
    tr.getLayer()?.batchDraw(); 
  }, [selectedTableId, tables]); 


  const handleChairDragEnd = (e: Konva.KonvaEventObject<DragEvent>, tableId: string, chairId: string) => {
    const draggedChairRawX = e.target.x();
    const draggedChairRawY = e.target.y();

    setTables(prevTables => {
        const tableIndex = prevTables.findIndex(t => t.id === tableId);
        if (tableIndex === -1) return prevTables;
        const table = prevTables[tableIndex];

        const tempChairsWithDraggedPos = table.chairs.map(chair =>
            chair.id === chairId ? { ...chair, x: draggedChairRawX, y: draggedChairRawY } : chair
        );
        
        const realignedChairs = alignChairsOnTable({ ...table, chairs: tempChairsWithDraggedPos });

        const newTables = [...prevTables];
        newTables[tableIndex] = { ...table, chairs: realignedChairs };
        return newTables;
    });
  };

  const handleSaveLayout = async () => {
    if (!layoutNameInput.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your layout.",
        variant: "destructive",
      });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save a layout. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingLayout(true);

    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

    const tablesToStore: StoredTableElement[] = tables.map(currentTable => {
      const tableData: Partial<StoredTableElement> = { // Use Partial for constructing
        ...currentTable,
        chairs: currentTable.chairs.map(chair => ({ ...chair } as StoredChair))
      };
      // Only include radius if it's a circle and radius is a valid number
      if (currentTable.type === 'circle' && typeof currentTable.radius === 'number') {
        tableData.radius = currentTable.radius;
      } else {
        delete tableData.radius; // Ensure radius is not undefined
      }
      return tableData as StoredTableElement; // Cast to full type after construction
    });


    const newLayoutData = { 
      name: layoutNameInput.trim(),
      ownerId: currentUser.uid,
      isPublic: false, // User-created layouts are private by default
      tables: tablesToStore,
      venueShape: venueShape.length > 0 ? venueShape : [], 
      totalCapacity,
    };

    try {
      const docRef = await addDoc(collection(db, "venueLayouts"), {
        ...newLayoutData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Layout Saved!",
        description: `Layout "${layoutNameInput.trim()}" has been successfully saved.`,
      });
      setIsSaveLayoutDialogOpen(false);
      setLayoutNameInput("");
      // router.push('/dashboard/seating'); 
    } catch (error: any) {
      console.error("Error saving layout:", error);
      toast({
        title: "Save Failed",
        description: `Could not save layout. ${error.message || 'Unknown error.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSavingLayout(false);
    }
  };


  return (
    <div className="flex flex-col gap-6 md:gap-8 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Create New Venue Layout</h1>
        </div>
        <Button variant="default" onClick={() => setIsSaveLayoutDialogOpen(true)} disabled={tables.length === 0 || isSavingLayout}>
          {isSavingLayout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Layout
        </Button> 
      </div>
      <div className="flex flex-grow gap-4 overflow-hidden">
        <Card className="w-64 flex-shrink-0 shadow-md">
          <CardHeader>
            <CardTitle>Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => openGuestNumberDialog('rect')}>
              <Square className="mr-2 h-4 w-4" /> Add Rect Table
            </Button>
            <Button className="w-full" onClick={() => openGuestNumberDialog('square')}>
              <Square className="mr-2 h-4 w-4" /> Add Square Table
            </Button>
            <Button className="w-full" onClick={() => openGuestNumberDialog('circle')}>
              <CircleIcon className="mr-2 h-4 w-4" /> Add Round Table
            </Button>
            <Separator className="my-2" />
            <Button
              className="w-full"
              variant={'outline'} 
              onClick={() => {
                toast({ title: "Coming Soon", description: "Drawing venue shape feature is not yet implemented."})
              }}
            >
              Draw Venue Shape (Soon)
            </Button>
          </CardContent>
        </Card>
        <div id="layout-editor-canvas-container" className="flex-grow relative bg-muted/50 rounded-md border border-input overflow-hidden">
          <Stage 
            ref={stageRef}
            width={stageDimensions.width} 
            height={stageDimensions.height} 
            onMouseDown={handleStageMouseDown} 
            className="bg-white"
          >
            <Layer>
              {venueShape.length >= 4 && (
                <Line points={venueShape} closed stroke="#a1887f" strokeWidth={2} fill="#efebe9" listening={false} />
              )}
              {tables.map(table => {
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
                <Group
                  key={table.id}
                  id={table.id}
                  x={table.x}
                  y={table.y}
                  rotation={table.rotation}
                  draggable={true}
                  offsetX={0} // Rects draw from top-left of group
                  offsetY={0} // Circles draw from center of group with radius
                  ref={node => { 
                    if (node) {
                      tableNodeRefs.current.set(table.id, node);
                    } else {
                      tableNodeRefs.current.delete(table.id);
                    }
                  }}
                  onDragEnd={(e) => {
                    if (selectedTableId === table.id) { return; } 
                    
                    const newTables = tables.map(t =>
                        t.id === table.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    );
                    const currentTableState = newTables.find(t => t.id === table.id);
                    if (currentTableState) {
                        const realignedChairs = alignChairsOnTable(currentTableState);
                        setTables(newTables.map(t => t.id === table.id ? { ...t, chairs: realignedChairs } : t));
                    } else {
                        setTables(newTables);
                    }
                  }}
                  onDblClick={() => handleTableDblClick(table.id)}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Group;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    
                    setTables(prevTables => {
                        const updatedTables = prevTables.map(t => {
                            if (t.id === table.id) {
                               const newWidth = t.type === 'circle' ? (t.radius || 0) * 2 * Math.max(scaleX,scaleY) : t.width * scaleX;
                               const newHeight = t.type === 'circle' ? (t.radius || 0) * 2 * Math.max(scaleX,scaleY) : t.height * scaleY;
                               const newRadius = t.type === 'circle' ? (t.radius || 0) * Math.max(scaleX, scaleY) : undefined;

                               const transformedTableState = {
                                ...t,
                                x: node.x(),
                                y: node.y(),
                                rotation: node.rotation(),
                                width: newWidth,
                                height: newHeight,
                                radius: newRadius,
                               };
                               const realignedChairs = alignChairsOnTable(transformedTableState);
                               return { ...transformedTableState, chairs: realignedChairs };
                            }
                            return t;
                        });
                        return updatedTables;
                    });
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                >
                  {table.type === 'rect' ? (
                    <Rect
                      x={-table.width / 2} // Center the rect within the group
                      y={-table.height / 2} // Center the rect within the group
                      width={table.width}
                      height={table.height}
                      fill="#d7ccc8" 
                      stroke="#8d6e63" 
                      strokeWidth={1.5}
                      cornerRadius={4}
                      shadowBlur={3}
                      shadowOpacity={0.2}
                      shadowOffsetX={1}
                      shadowOffsetY={1}
                    />
                  ) : (
                    <KonvaCircle
                      radius={table.radius} 
                      fill="#d7ccc8"
                      stroke="#8d6e63"
                      strokeWidth={1.5}
                      shadowBlur={3}
                      shadowOpacity={0.2}
                      shadowOffsetX={1}
                      shadowOffsetY={1}
                    />
                  )}
                  {table.chairs.map(chair => (
                    <KonvaCircle
                        key={chair.id} 
                        id={chair.id}
                        x={chair.x} 
                        y={chair.y} 
                        radius={CHAIR_RADIUS} 
                        fill="#f5f5f5" 
                        stroke="#a1887f" 
                        strokeWidth={1} 
                        draggable={table.id === selectedTableId}
                        onDragStart={(e) => { e.cancelBubble = true; }}
                        onDragEnd={(e) => handleChairDragEnd(e, table.id, chair.id)}
                        dragBoundFunc={(pos) => {
                            if (table.type === 'rect') {
                                const tableNode = tableNodeRefs.current.get(table.id);
                                const transform = tableNode
                                  ? tableNode.getAbsoluteTransform().copy() // Use absolute transform of the group
                                  : new Konva.Transform();
                                return chairDragBoundFunc(
                                  pos,
                                  table.width,
                                  table.height,
                                  transform // Pass the group's transform
                                );
                            }
                            return pos;
                        }}
                    />
                  ))}
                  <Text
                    text={`#${table.displayOrderNumber}`}
                    fontSize={fontSizeNumber}
                    fill="#3e2723"
                    fontStyle="bold"
                    x={0} // Centered within group
                    y={yPosNumberText}
                    width={tableWidthForText}
                    height={textBlockRenderHeightNumber}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                    offsetX={tableWidthForText / 2} // Center text content
                  />
                  <Text
                    text={`(${table.capacity}pp)`}
                    fontSize={fontSizeCapacity}
                    fill="#5d4037"
                    x={0} // Centered within group
                    y={yPosCapacityText}
                    width={tableWidthForText}
                    height={textBlockRenderHeightCapacity}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                    offsetX={tableWidthForText / 2} // Center text content
                  />
                </Group>
                );
              })}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>

      <Dialog open={isGuestNumberDialogOpen} onOpenChange={setIsGuestNumberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Table Capacity</DialogTitle>
            <DialogDescription>
              How many guests will this {tableTypeToAdd} table accommodate?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guest-count" className="text-right">
                Guests
              </Label>
              <Input
                id="guest-count"
                type="number"
                value={guestCountInput}
                onChange={(e) => setGuestCountInput(e.target.value)}
                className="col-span-3"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleConfirmAddTable}>Add Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTableNumberDialogOpen} onOpenChange={setIsEditTableNumberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table Number</DialogTitle>
            <DialogDescription>
              Enter the new number for this table. If the number is in use, tables will swap numbers.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table-number-edit" className="text-right">
                Table #
              </Label>
              <Input
                id="table-number-edit"
                type="number"
                value={newTableNumberInput}
                onChange={(e) => setNewTableNumberInput(e.target.value)}
                className="col-span-3"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setEditingTableIdForNumber(null)}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveTableNumber}>Save Number</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Layout Dialog */}
      <Dialog open={isSaveLayoutDialogOpen} onOpenChange={setIsSaveLayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Venue Layout</DialogTitle>
            <DialogDescription>
              Enter a name for this layout. This will help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layout-name" className="text-right">
                Layout Name
              </Label>
              <Input
                id="layout-name"
                value={layoutNameInput}
                onChange={(e) => setLayoutNameInput(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Main Ballroom Setup"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setLayoutNameInput("")}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveLayout} disabled={isSavingLayout || !layoutNameInput.trim()}>
              {isSavingLayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
