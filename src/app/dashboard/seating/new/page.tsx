
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
  width: number;      // Always defined, even for circles (diameter)
  height: number;     // Always defined, even for circles (diameter)
  radius?: number;     // Specific to circles
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


  const generateChairs = useCallback((table: Omit<TableElement, 'chairs' | 'id' | 'displayOrderNumber' | 'rotation'>): Chair[] => {
    const chairs: Chair[] = [];
    const { type, width, height, radius, capacity } = table;
    if (capacity === 0) return chairs;

    const chairRadius = 8; // Visual radius of chair
    const chairSpacingFromTable = 15; // Distance from table edge to chair center

    if (type === 'rect') {
        let chairsPerLongSide = 0;
        let chairsPerShortSide = 0;
        const w = width;
        const h = height;

        if (w === h) { // Square
            const chairsPerSide = Math.ceil(capacity / 4);
            chairsPerLongSide = chairsPerSide;
            chairsPerShortSide = chairsPerSide;
        } else { // Rectangle
            const longSideRatio = w > h ? 0.35 : 0.15; // More chairs on longer side
            const shortSideRatio = w < h ? 0.35 : 0.15;
            chairsPerLongSide = Math.min(Math.floor(w / 30), Math.ceil(capacity * longSideRatio));
            chairsPerShortSide = Math.min(Math.floor(h / 30), Math.ceil(capacity * shortSideRatio));
        }
        
        let placedChairs = 0;

        // Top side
        if (chairsPerLongSide > 0 && placedChairs < capacity) {
            const effectiveNum = Math.min(chairsPerLongSide, capacity - placedChairs);
            const spacingX = w / (effectiveNum + 1);
            for (let i = 0; i < effectiveNum; i++) {
                if (placedChairs >= capacity) break;
                chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: -h / 2 - chairRadius - chairSpacingFromTable });
                placedChairs++;
            }
        }
        // Bottom side
        if (chairsPerLongSide > 0 && placedChairs < capacity) {
            const effectiveNum = Math.min(chairsPerLongSide, capacity - placedChairs);
            const spacingX = w / (effectiveNum + 1);
            for (let i = 0; i < effectiveNum; i++) {
                if (placedChairs >= capacity) break;
                chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: h / 2 + chairRadius + chairSpacingFromTable });
                placedChairs++;
            }
        }
        // Left side
        if (chairsPerShortSide > 0 && placedChairs < capacity) {
            const effectiveNum = Math.min(chairsPerShortSide, capacity - placedChairs);
            const spacingY = h / (effectiveNum + 1);
            for (let i = 0; i < effectiveNum; i++) {
                 if (placedChairs >= capacity) break;
                chairs.push({ id: uuidv4(), x: -w / 2 - chairRadius - chairSpacingFromTable, y: (i + 1) * spacingY - h / 2 });
                placedChairs++;
            }
        }
        // Right side
        if (chairsPerShortSide > 0 && placedChairs < capacity) {
            const effectiveNum = Math.min(chairsPerShortSide, capacity - placedChairs);
            const spacingY = h / (effectiveNum + 1);
            for (let i = 0; i < effectiveNum; i++) {
                if (placedChairs >= capacity) break;
                chairs.push({ id: uuidv4(), x: w / 2 + chairRadius + chairSpacingFromTable, y: (i + 1) * spacingY - h / 2 });
                placedChairs++;
            }
        }
         // Fallback for any remaining chairs (distribute somewhat evenly)
        let sideIndex = 0;
        const sidePlacementFunctions = [
            (idx: number, num: number) => ({ x: (idx + 1) * (w / (num + 1)) - w/2, y: -h/2 - chairRadius - chairSpacingFromTable}), // Top
            (idx: number, num: number) => ({ x: (idx + 1) * (w / (num + 1)) - w/2, y: h/2 + chairRadius + chairSpacingFromTable}),  // Bottom
            (idx: number, num: number) => ({ x: -w/2 - chairRadius - chairSpacingFromTable, y: (idx + 1) * (h/(num+1)) - h/2}), // Left
            (idx: number, num: number) => ({ x: w/2 + chairRadius - chairSpacingFromTable, y: (idx + 1) * (h/(num+1)) - h/2}),  // Right
        ];
        let chairsOnSideCount = [0,0,0,0];

        while(placedChairs < capacity && chairs.length < capacity * 1.5) { // Safety break
            const currentSideMax = sideIndex % 2 === 0 ? Math.floor(w/30) : Math.floor(h/30);
            if(chairsOnSideCount[sideIndex % 4] < currentSideMax){
                const pos = sidePlacementFunctions[sideIndex % 4](chairsOnSideCount[sideIndex % 4], currentSideMax);
                chairs.push({id: uuidv4(), x: pos.x, y: pos.y });
                chairsOnSideCount[sideIndex % 4]++;
                placedChairs++;
            }
            sideIndex++;
        }


    } else if (type === 'circle' && radius) {
      for (let i = 0; i < capacity; i++) {
        const angle = (2 * Math.PI * i) / capacity;
        chairs.push({ 
          id: uuidv4(), 
          x: Math.cos(angle) * (radius + chairRadius + chairSpacingFromTable), 
          y: Math.sin(angle) * (radius + chairRadius + chairSpacingFromTable) 
        });
      }
    }
    return chairs.slice(0, capacity); // Ensure exact number of chairs
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
    const initialX = (stageDimensions.width / 2) + Math.random() * 100 - 50;
    const initialY = (stageDimensions.height / 2) + Math.random() * 100 - 50;
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
    if (e.target === stage) {
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
        if (node instanceof Konva.Group && typeof node.id() === 'string' && tables.some(t => t.id === node.id())) {
            setSelectedTableId(node.id());
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
    if (isNaN(newNumber) || newNumber < 1 || newNumber > tables.length) {
      toast({
        title: "Invalid Table Number",
        description: `Please enter a number between 1 and ${tables.length}.`,
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
          width: editorElement.offsetWidth > 0 ? editorElement.offsetWidth - 2 : 800, // -2 for border
          height: editorElement.offsetHeight > 0 ? editorElement.offsetHeight -2 : 600, // -2 for border
        });
      } else if (typeof window !== 'undefined') {
         setStageDimensions({
            width: window.innerWidth - 280, 
            height: window.innerHeight - 150 
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
    const newX = e.target.x();
    const newY = e.target.y();

    setTables(prevTables => 
      prevTables.map(table => {
        if (table.id === tableId) {
          return {
            ...table,
            chairs: table.chairs.map(chair => 
              chair.id === chairId ? { ...chair, x: newX, y: newY } : chair
            )
          };
        }
        return table;
      })
    );
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
            >
              {drawingVenue ? 'Finish Venue Shape' : 'Draw Venue Shape'}
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
                  draggable
                  ref={node => { 
                    if (node) {
                      tableNodeRefs.current.set(table.id, node);
                    } else {
                      tableNodeRefs.current.delete(table.id);
                    }
                  }}
                  onDragEnd={(e) => {
                    const newTables = tables.map(t => 
                      t.id === table.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    );
                    setTables(newTables);
                  }}
                  onDblClick={() => handleTableDblClick(table.id)}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    
                    node.scaleX(1);
                    node.scaleY(1);

                    const newWidth = Math.max(20, table.width * scaleX);
                    const newHeight = Math.max(20, table.height * scaleY);
                    
                    let updatedTable = tables.find(t => t.id === table.id);
                    if (!updatedTable) return;

                    let newAttrs: Partial<TableElement> = {
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        // chairs are preserved, not regenerated here
                    };

                    if (updatedTable.type === 'circle') {
                        const newRadius = Math.max(10, (updatedTable.radius || Math.min(updatedTable.width, updatedTable.height)/2) * Math.max(scaleX, scaleY)); 
                        newAttrs.radius = newRadius;
                        newAttrs.width = newRadius * 2;
                        newAttrs.height = newRadius * 2;
                    } else {
                        newAttrs.width = newWidth;
                        newAttrs.height = newHeight;
                    }
                    
                    setTables(prevTables => prevTables.map(t => 
                      t.id === table.id ? { ...t, ...newAttrs } : t
                    ));
                  }}
                >
                  {table.type === 'rect' ? (
                    <Rect
                      width={table.width}
                      height={table.height}
                      fill="#d7ccc8" 
                      stroke="#8d6e63" 
                      strokeWidth={1.5}
                      cornerRadius={4}
                      offset={{ x: table.width / 2, y: table.height / 2 }}
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
                        radius={8} 
                        fill="#f5f5f5" 
                        stroke="#a1887f" 
                        strokeWidth={1} 
                        draggable={table.id === selectedTableId}
                        onDragEnd={(e) => handleChairDragEnd(e, table.id, chair.id)}
                        // Optional: Prevent table drag when chair drag starts
                        onDragStart={(e) => { 
                            e.cancelBubble = true; 
                            // If the table group is also draggable, you might need:
                            // const tableNode = tableNodeRefs.current.get(table.id);
                            // if (tableNode) tableNode.draggable(false);
                        }}
                        // Optional: Re-enable table drag if it was disabled
                        // onMouseUp={(e) => {
                        //     const tableNode = tableNodeRefs.current.get(table.id);
                        //     if (tableNode) tableNode.draggable(true);
                        // }}
                    />
                  ))}
                  <Text 
                    text={`#${table.displayOrderNumber}`}
                    fontSize={fontSizeNumber}
                    fill="#3e2723"
                    fontStyle="bold"
                    x={0}
                    y={yPosNumberText}
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
                    x={0}
                    y={yPosCapacityText}
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
                max={tables.length}
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
