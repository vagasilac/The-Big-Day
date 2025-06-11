
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
import { Square, Circle as CircleIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
const CHAIR_SPACING_FROM_TABLE = 15;

// Helper function to determine which side a chair should snap to for rectangular tables
const getChairSnapSide = (
  chairX: number, // Chair's x relative to table center
  chairY: number, // Chair's y relative to table center
  tableWidth: number,
  tableHeight: number
): 'top' | 'bottom' | 'left' | 'right' => {
  const halfWidth = tableWidth / 2;
  const halfHeight = tableHeight / 2;
  // Threshold to prefer snapping to an edge rather than being perfectly diagonal
  const preferenceThreshold = (CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE) * 1.5;

  // Check if chair is clearly outside one edge more than others
  if (chairY < -halfHeight - preferenceThreshold) return 'top';
  if (chairY > halfHeight + preferenceThreshold) return 'bottom';
  if (chairX < -halfWidth - preferenceThreshold) return 'left';
  if (chairX > halfWidth + preferenceThreshold) return 'right';

  // If not clearly outside, determine by proximity to axes adjusted for table aspect ratio
  // Closer to horizontal axis (top/bottom sides) or vertical axis (left/right sides)
  const normalizedY = Math.abs(chairY / (tableHeight + CHAIR_SPACING_FROM_TABLE * 2));
  const normalizedX = Math.abs(chairX / (tableWidth + CHAIR_SPACING_FROM_TABLE * 2));

  if (normalizedY > normalizedX) {
    return chairY < 0 ? 'top' : 'bottom';
  } else {
    return chairX < 0 ? 'left' : 'right';
  }
};


export default function NewLayoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tables, setTables] = useState<TableElement[]>([]);
  const [venueShape, setVenueShape] = useState<number[]>([]);
  const [drawingVenue, setDrawingVenue] = useState(false);

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


  const generateChairs = useCallback((table: Omit<TableElement, 'id' | 'chairs' | 'displayOrderNumber' | 'rotation'>): Chair[] => {
    const chairsArray: Chair[] = [];
    const { type, width, height, radius, capacity } = table;
    if (capacity === 0) return chairsArray;

    if (type === 'rect') {
        const w = width;
        const h = height;

        const sideCapacities = {
            top: Math.floor(w / (CHAIR_RADIUS * 2.5)),
            bottom: Math.floor(w / (CHAIR_RADIUS * 2.5)),
            left: Math.floor(h / (CHAIR_RADIUS * 2.5)),
            right: Math.floor(h / (CHAIR_RADIUS * 2.5)),
        };
        
        const sidePreference: Array<'top' | 'bottom' | 'left' | 'right'> = [];
        if (w >= h) { 
            sidePreference.push('top', 'bottom', 'left', 'right');
        } else { 
            sidePreference.push('left', 'right', 'top', 'bottom');
        }
        
        const chairsAssignedToSide: { top: number; bottom: number; left: number; right: number } = {
            top: 0, bottom: 0, left: 0, right: 0
        };

        let totalPlaced = 0;
        let loopIterations = 0;

        while (totalPlaced < capacity && loopIterations < capacity * (sidePreference.length +1) ) { 
            for (const side of sidePreference) {
                if (totalPlaced >= capacity) break;
                if (chairsAssignedToSide[side] < sideCapacities[side]) {
                    chairsAssignedToSide[side]++;
                    totalPlaced++;
                }
            }
            if (sidePreference.every(side => chairsAssignedToSide[side] >= sideCapacities[side]) && totalPlaced < capacity) {
                break;
            }
            loopIterations++;
        }
        
        (Object.keys(chairsAssignedToSide) as Array<'top' | 'bottom' | 'left' | 'right'>).forEach(sideKey => {
            const numChairsOnThisSide = chairsAssignedToSide[sideKey];
            if (numChairsOnThisSide === 0) return;

            for (let i = 0; i < numChairsOnThisSide; i++) {
                let chairX = 0;
                let chairY = 0;
                switch (sideKey) {
                    case 'top':
                        chairY = -h / 2 - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
                        chairX = (i + 1) * (w / (numChairsOnThisSide + 1)) - w / 2;
                        break;
                    case 'bottom':
                        chairY = h / 2 + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
                        chairX = (i + 1) * (w / (numChairsOnThisSide + 1)) - w / 2;
                        break;
                    case 'left':
                        chairX = -w / 2 - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
                        chairY = (i + 1) * (h / (numChairsOnThisSide + 1)) - h / 2;
                        break;
                    case 'right':
                        chairX = w / 2 + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
                        chairY = (i + 1) * (h / (numChairsOnThisSide + 1)) - h / 2;
                        break;
                }
                chairsArray.push({ id: uuidv4(), x: chairX, y: chairY });
            }
        });

    } else if (type === 'circle' && radius) {
      for (let i = 0; i < capacity; i++) {
        const angle = (2 * Math.PI * i) / capacity;
        chairsArray.push({ 
          id: uuidv4(), 
          x: Math.cos(angle) * (radius + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE), 
          y: Math.sin(angle) * (radius + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE) 
        });
      }
    }
    return chairsArray.slice(0, capacity);
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
    
    const chairs = generateChairs(newTableBase);
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
     if (newNumber > tables.length && tables.some(t => t.displayOrderNumber === newNumber && t.id !== editingTableIdForNumber)) {
         toast({
            title: "Invalid Table Number",
            description: `Please enter a number between 1 and ${tables.length} if swapping. To set a higher number, ensure it's unique or adjust other tables first.`,
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
    const newChairX = e.target.x();
    const newChairY = e.target.y();

    setTables(prevTables => {
      const tableIndex = prevTables.findIndex(t => t.id === tableId);
      if (tableIndex === -1) return prevTables;

      const table = prevTables[tableIndex];

      if (table.type === 'circle') { 
        const updatedChairs = table.chairs.map(chair =>
          chair.id === chairId ? { ...chair, x: newChairX, y: newChairY } : chair
        );
        const newTables = [...prevTables];
        newTables[tableIndex] = { ...table, chairs: updatedChairs };
        return newTables;
      }

      const chairsBySide: { top: Chair[]; bottom: Chair[]; left: Chair[]; right: Chair[] } = {
        top: [], bottom: [], left: [], right: []
      };
      const draggedChairOriginal = table.chairs.find(c => c.id === chairId);
      if (!draggedChairOriginal) return prevTables;

      const draggedChairTargetSide = getChairSnapSide(newChairX, newChairY, table.width, table.height);

      table.chairs.forEach(c => {
        let side: 'top' | 'bottom' | 'left' | 'right';
        if (c.id === chairId) {
          side = draggedChairTargetSide; 
          chairsBySide[side].push({ ...c, x: newChairX, y: newChairY }); 
        } else {
          side = getChairSnapSide(c.x, c.y, table.width, table.height);
          chairsBySide[side].push(c);
        }
      });

      const newAlignedChairsArray: Chair[] = [];
      (['top', 'bottom', 'left', 'right'] as const).forEach(sideKey => {
        const sideChairs = chairsBySide[sideKey];
        const numChairsOnThisSide = sideChairs.length;
        if (numChairsOnThisSide === 0) return;

        sideChairs.sort((a, b) => {
          if (sideKey === 'top' || sideKey === 'bottom') return a.x - b.x;
          return a.y - b.y;
        });

        sideChairs.forEach((chair, index) => {
          let finalX = chair.x;
          let finalY = chair.y;

          switch (sideKey) {
            case 'top':
              finalY = -table.height / 2 - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
              finalX = (index + 1) * (table.width / (numChairsOnThisSide + 1)) - table.width / 2;
              break;
            case 'bottom':
              finalY = table.height / 2 + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
              finalX = (index + 1) * (table.width / (numChairsOnThisSide + 1)) - table.width / 2;
              break;
            case 'left':
              finalX = -table.width / 2 - CHAIR_RADIUS - CHAIR_SPACING_FROM_TABLE;
              finalY = (index + 1) * (table.height / (numChairsOnThisSide + 1)) - table.height / 2;
              break;
            case 'right':
              finalX = table.width / 2 + CHAIR_RADIUS + CHAIR_SPACING_FROM_TABLE;
              finalY = (index + 1) * (table.height / (numChairsOnThisSide + 1)) - table.height / 2;
              break;
          }
          newAlignedChairsArray.push({ ...chair, x: finalX, y: finalY });
        });
      });
      
      const newTables = [...prevTables];
      newTables[tableIndex] = { ...table, chairs: newAlignedChairsArray };
      return newTables;
    });
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
        <Button variant="default" disabled>Save Layout</Button> 
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
              variant={drawingVenue ? 'secondary' : 'outline'}
              onClick={() => {
                setVenueShape([]);
                setDrawingVenue(d => !d);
              }}
              disabled 
            >
              {drawingVenue ? 'Finish Venue Shape' : 'Draw Venue Shape (Soon)'}
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
                  ref={node => { 
                    if (node) {
                      tableNodeRefs.current.set(table.id, node);
                    } else {
                      tableNodeRefs.current.delete(table.id);
                    }
                  }}
                  onDragEnd={(e) => {
                    if (selectedTableId === table.id) {
                      return; // Transformer handles this via onTransformEnd
                    }
                    setTables(prevTables =>
                      prevTables.map(t =>
                        t.id === table.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                      )
                    );
                  }}
                  onDblClick={() => handleTableDblClick(table.id)}
                  onTransformEnd={(e) => {
                    const node = e.target as Konva.Group;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    
                    setTables(prevTables =>
                      prevTables.map(t => {
                        if (t.id === table.id) {
                           const currentTableState = prevTables.find(pts => pts.id === table.id)!;

                           const newWidth = t.type === 'circle' ? (currentTableState.radius || 0) * 2 * Math.max(scaleX,scaleY) : currentTableState.width * scaleX;
                           const newHeight = t.type === 'circle' ? (currentTableState.radius || 0) * 2 * Math.max(scaleX,scaleY) : currentTableState.height * scaleY;
                           const newRadius = t.type === 'circle' ? (currentTableState.radius || 0) * Math.max(scaleX, scaleY) : undefined;

                          return {
                            ...currentTableState,
                            x: node.x(),
                            y: node.y(),
                            rotation: node.rotation(),
                            width: newWidth,
                            height: newHeight,
                            radius: newRadius,
                             chairs: currentTableState.chairs.map(chair => ({
                              ...chair,
                              x: chair.x * scaleX, 
                              y: chair.y * scaleY, 
                            })),
                          };
                        }
                        return t;
                      })
                    );
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                  offsetX={table.type === 'rect' ? table.width / 2 : 0}
                  offsetY={table.type === 'rect' ? table.height / 2 : 0}
                >
                  {table.type === 'rect' ? (
                    <Rect
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
                        onDragStart={(e) => { 
                            e.cancelBubble = true; 
                        }}
                        onDragEnd={(e) => handleChairDragEnd(e, table.id, chair.id)}
                    />
                  ))}
                  <Text 
                    text={`#${table.displayOrderNumber}`}
                    fontSize={fontSizeNumber}
                    fill="#3e2723"
                    fontStyle="bold"
                    x={table.type === 'rect' ? table.width / 2 : 0}
                    y={table.type === 'rect' ? table.height / 2 + yPosNumberText : yPosNumberText}
                    width={tableWidthForText}
                    height={textBlockRenderHeightNumber}
                    offsetX={tableWidthForText / 2}
                    offsetY={textBlockRenderHeightNumber / 2}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />
                  <Text 
                    text={`(${table.capacity}pp)`}
                    fontSize={fontSizeCapacity}
                    fill="#5d4037"
                    x={table.type === 'rect' ? table.width / 2 : 0}
                    y={table.type === 'rect' ? table.height / 2 + yPosCapacityText : yPosCapacityText}
                    width={tableWidthForText}
                    height={textBlockRenderHeightCapacity}
                    offsetX={tableWidthForText / 2}
                    offsetY={textBlockRenderHeightCapacity / 2}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
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

    </div>
  );
}
