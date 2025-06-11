
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stage, Layer, Rect, Circle as KonvaCircle, Group, Line, Text } from 'react-konva';
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
  width?: number;
  height?: number;
  radius?: number;
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


  const generateRectChairs = (w: number, h: number, cap: number) => {
    const chairs: Chair[] = [];
    if (cap === 0) return { chairs };

    let chairsPerLongSide = 0;
    let chairsPerShortSide = 0;

    if (w === h) { 
        const chairsPerSide = Math.ceil(cap / 4);
        chairsPerLongSide = chairsPerSide;
        chairsPerShortSide = chairsPerSide;
    } else { 
        const longSideRatio = w > h ? 0.35 : 0.15;
        const shortSideRatio = w < h ? 0.35 : 0.15;
        chairsPerLongSide = Math.min(Math.floor(w/30), Math.ceil(cap * longSideRatio));
        chairsPerShortSide = Math.min(Math.floor(h/30), Math.ceil(cap * shortSideRatio));
    }
    
    let placedChairs = 0;
    const chairRadius = 8;
    const chairSpacingFromTable = 15; 

    // Top side
    if (chairsPerLongSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerLongSide, Math.floor((cap - placedChairs) / (w > h ? 2 : 1) ) );
        const spacingX = w / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
          if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: -h / 2 - chairRadius - chairSpacingFromTable });
            placedChairs++;
          }
        }
    }

    // Bottom side
    if (chairsPerLongSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerLongSide, Math.floor((cap - placedChairs) / (w > h && placedChairs < cap / 2 ? 1 : 2) ) );
        const spacingX = w / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
          if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: h / 2 + chairRadius + chairSpacingFromTable });
            placedChairs++;
          }
        }
    }
    
    // Left side
    if (chairsPerShortSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerShortSide, Math.floor((cap - placedChairs) / (h > w ? 2 : 1) ) );
        const spacingY = h / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
          if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: -w / 2 - chairRadius - chairSpacingFromTable, y: (i + 1) * spacingY - h / 2 });
            placedChairs++;
          }
        }
    }

    // Right side
    if (chairsPerShortSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerShortSide, cap - placedChairs);
        const spacingY = h / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
         if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: w / 2 + chairRadius + chairSpacingFromTable, y: (i + 1) * spacingY - h / 2 });
            placedChairs++;
          }
        }
    }
    
    let side = 0; 
    const sides = [
        { xOffset: 0, yOffset: -h / 2 - chairRadius - chairSpacingFromTable, isLong: w >= h }, // Top
        { xOffset: 0, yOffset: h / 2 + chairRadius + chairSpacingFromTable, isLong: w >= h },  // Bottom
        { xOffset: -w / 2 - chairRadius - chairSpacingFromTable, yOffset: 0, isLong: h > w }, // Left
        { xOffset: w / 2 + chairRadius + chairSpacingFromTable, yOffset: 0, isLong: h > w },   // Right
    ];

    while(placedChairs < cap && chairs.length < cap * 1.5){
        const currentSideConfig = sides[side % 4];
        let x=0, y=0;
        if (currentSideConfig.isLong) { // Place along width (top/bottom)
            x = (placedChairs % (Math.floor(w/30) || 1)) * 30 - w/2 + 15; // simplified placement
            y = currentSideConfig.yOffset;
        } else { // Place along height (left/right)
            x = currentSideConfig.xOffset;
            y = (placedChairs % (Math.floor(h/30) || 1)) * 30 - h/2 + 15; // simplified placement
        }
        
        const tooClose = chairs.some(c => Math.abs(c.x - x) < 20 && Math.abs(c.y - y) < 20);
        if (!tooClose) {
             chairs.push({id: uuidv4(), x,y});
             placedChairs++;
        }
        side++;
    }
    return { chairs: chairs.slice(0, cap) };
  };

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

    let newTable: Omit<TableElement, 'id' | 'displayOrderNumber'> & { id?: string, displayOrderNumber?: number } | null = null;
    const initialX = 200 + Math.random() * 100 - 50;
    const initialY = 200 + Math.random() * 100 - 50;
    const displayOrderNumber = tables.length + 1;

    if (tableTypeToAdd === 'rect') {
      const width = 120;
      const height = 60;
      const { chairs } = generateRectChairs(width, height, cap);
      newTable = { type: 'rect', x: initialX, y: initialY, width, height, capacity: cap, chairs };
    } else if (tableTypeToAdd === 'square') {
      const sideLength = 80;
      const { chairs } = generateRectChairs(sideLength, sideLength, cap);
      newTable = { type: 'rect', x: initialX, y: initialY, width: sideLength, height: sideLength, capacity: cap, chairs };
    } else if (tableTypeToAdd === 'circle') {
      const radius = 50;
      const chairs: Chair[] = [];
      for (let i = 0; i < cap; i++) {
        const angle = (2 * Math.PI * i) / cap;
        chairs.push({ id: uuidv4(), x: Math.cos(angle) * (radius + 20), y: Math.sin(angle) * (radius + 20) });
      }
      newTable = { type: 'circle', x: initialX, y: initialY, radius, capacity: cap, chairs };
    }

    if (newTable) {
      setTables(t => [...t, { ...newTable!, id: uuidv4(), displayOrderNumber }]);
    }
    setIsGuestNumberDialogOpen(false);
    setTableTypeToAdd(null);
  };

  const handleStageClick = (e: any) => {
    if (!drawingVenue) return;
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    setVenueShape(prev => [...prev, pointer.x, pointer.y]);
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
          width: editorElement.offsetWidth > 0 ? editorElement.offsetWidth : 800,
          height: editorElement.offsetHeight > 0 ? editorElement.offsetHeight : 600,
        });
      } else if (typeof window !== 'undefined') {
         setStageDimensions({
            width: window.innerWidth - 320, 
            height: window.innerHeight - 200 
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);


  return (
    <div className="flex flex-col gap-6 md:gap-8 h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Venue Layout</h1>
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
             <Button className="w-full mt-4" variant="default" disabled>Save Layout</Button>
          </CardContent>
        </Card>
        <div id="layout-editor-canvas-container" className="flex-grow relative bg-muted/50 rounded-md overflow-hidden">
          <Stage 
            width={stageDimensions.width} 
            height={stageDimensions.height} 
            onMouseDown={handleStageClick} 
            className="bg-white"
          >
            <Layer>
              {venueShape.length >= 4 && (
                <Line points={venueShape} closed stroke="#a1887f" strokeWidth={2} fill="#efebe9" />
              )}
              {tables.map(table => {
                const isCircle = table.type === 'circle';
                const tableWidth = table.width || (table.radius ? table.radius * 2 : 0);
                const tableHeight = table.height || (table.radius ? table.radius * 2 : 0);

                const fontSizeNumber = isCircle ? FONT_SIZE_NUMBER_CIRCLE : FONT_SIZE_NUMBER_RECT;
                const fontSizeCapacity = isCircle ? FONT_SIZE_CAPACITY_CIRCLE : FONT_SIZE_CAPACITY_RECT;
                
                // Estimate text heights (Konva doesn't give actual rendered height easily without rendering)
                const numberTextHeightEstimate = fontSizeNumber; 
                const capacityTextHeightEstimate = fontSizeCapacity;

                const totalTextContentHeight = numberTextHeightEstimate + TEXT_VERTICAL_GAP + capacityTextHeightEstimate;

                const yPosNumberText = - (totalTextContentHeight / 2) + (numberTextHeightEstimate / 2);
                const yPosCapacityText = (totalTextContentHeight / 2) - (capacityTextHeightEstimate / 2);
                
                const textBlockRenderHeightNumber = numberTextHeightEstimate * 1.5; // Give some buffer for verticalAlign
                const textBlockRenderHeightCapacity = capacityTextHeightEstimate * 1.5;


                return (
                <Group key={table.id} x={table.x} y={table.y} draggable
                  onDragEnd={(e) => {
                    setTables(prevTables => prevTables.map(t => 
                      t.id === table.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    ));
                  }}
                  onDblClick={() => handleTableDblClick(table.id)}
                >
                  {table.type === 'rect' ? (
                    <Rect
                      width={table.width}
                      height={table.height}
                      fill="#d7ccc8" 
                      stroke="#8d6e63" 
                      strokeWidth={1.5}
                      cornerRadius={4}
                      offset={{ x: (table.width || 0) / 2, y: (table.height || 0) / 2 }}
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
                      offset={{ x: 0, y: 0 }} // Circle offset is implicitly 0,0 if x,y of group is center
                      shadowBlur={3}
                      shadowOpacity={0.2}
                      shadowOffsetX={1}
                      shadowOffsetY={1}
                    />
                  )}
                  {table.chairs.map(chair => (
                    <KonvaCircle
                        key={chair.id} 
                        x={chair.x} 
                        y={chair.y} 
                        radius={8} 
                        fill="#f5f5f5" 
                        stroke="#a1887f" 
                        strokeWidth={1} 
                    />
                  ))}
                  <Text
                    text={`#${table.displayOrderNumber}`}
                    fontSize={fontSizeNumber}
                    fill="#3e2723" // Darker for table number
                    fontStyle="bold"
                    x={0} // Centered by offsetX
                    y={yPosNumberText}
                    width={tableWidth}
                    height={textBlockRenderHeightNumber}
                    offsetX={tableWidth / 2}
                    offsetY={textBlockRenderHeightNumber / 2}
                    align="center"
                    verticalAlign="middle"
                  />
                  <Text
                    text={`(${table.capacity}pp)`}
                    fontSize={fontSizeCapacity}
                    fill="#5d4037" // Slightly lighter for capacity
                    x={0} // Centered by offsetX
                    y={yPosCapacityText}
                    width={tableWidth}
                    height={textBlockRenderHeightCapacity}
                    offsetX={tableWidth / 2}
                    offsetY={textBlockRenderHeightCapacity / 2}
                    align="center"
                    verticalAlign="middle"
                  />
                </Group>
                );
              })}
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

