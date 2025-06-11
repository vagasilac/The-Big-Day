
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stage, Layer, Rect, Circle as KonvaCircle, Group, Line } from 'react-konva'; // Renamed Circle to KonvaCircle
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
import { Square, Circle as CircleIcon, ArrowLeft } from 'lucide-react'; // CircleIcon for UI

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
}

export default function NewLayoutPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableElement[]>([]);
  const [venueShape, setVenueShape] = useState<number[]>([]); // polygon points
  const [drawingVenue, setDrawingVenue] = useState(false);

  const [isGuestNumberDialogOpen, setIsGuestNumberDialogOpen] = useState(false);
  const [tableTypeToAdd, setTableTypeToAdd] = useState<'rect' | 'square' | 'circle' | null>(null);
  const [guestCountInput, setGuestCountInput] = useState<string>("8");


  const generateRectChairs = (w: number, h: number, cap: number) => {
    const chairs: Chair[] = [];
    if (cap === 0) return { chairs };

    let chairsPerLongSide = 0;
    let chairsPerShortSide = 0;

    if (w === h) { // Square table
        const chairsPerSide = Math.ceil(cap / 4);
        chairsPerLongSide = chairsPerSide;
        chairsPerShortSide = chairsPerSide;
    } else { // Rectangle table
        // Simplified: attempt to put more on longer sides
        const longSideCount = w > h ? Math.ceil(cap * 0.35) : Math.ceil(cap * 0.15); // approx 35% on each long
        const shortSideCount = w < h ? Math.ceil(cap * 0.35) : Math.ceil(cap * 0.15); // approx 15% on each short
        chairsPerLongSide = Math.min(Math.floor(w/30), longSideCount); // Max chairs based on side length
        chairsPerShortSide = Math.min(Math.floor(h/30), shortSideCount);
    }
    
    let placedChairs = 0;
    const chairRadius = 8;
    const chairSpacingFromTable = 15; // Increased spacing for clarity

    // Top side (along width, y = -height/2)
    if (chairsPerLongSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerLongSide, cap - placedChairs);
        const spacingX = w / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
          if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: -h / 2 - chairRadius - chairSpacingFromTable });
            placedChairs++;
          }
        }
    }

    // Bottom side (along width, y = height/2)
    if (chairsPerLongSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerLongSide, cap - placedChairs);
        const spacingX = w / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
          if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: h / 2 + chairRadius + chairSpacingFromTable });
            placedChairs++;
          }
        }
    }
    
    // Left side (along height, x = -width/2)
    if (chairsPerShortSide > 0) {
        const effectiveNumChairs = Math.min(chairsPerShortSide, cap - placedChairs);
        const spacingY = h / (effectiveNumChairs + 1);
        for (let i = 0; i < effectiveNumChairs; i++) {
          if (placedChairs < cap) {
            chairs.push({ id: uuidv4(), x: -w / 2 - chairRadius - chairSpacingFromTable, y: (i + 1) * spacingY - h / 2 });
            placedChairs++;
          }
        }
    }

    // Right side (along height, x = width/2)
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
     // Fallback if not all chairs are placed (e.g. due to space constraints or rounding)
    // This simple fallback might not be perfect for all scenarios.
    let side = 0; // 0: top, 1: bottom, 2: left, 3: right
    while(placedChairs < cap && chairs.length < cap * 1.5){ // safety break
        let x=0, y=0;
        if(side === 0) { x = 0; y = -h / 2 - chairRadius - chairSpacingFromTable; }
        else if(side === 1) { x = 0; y = h / 2 + chairRadius + chairSpacingFromTable; }
        else if(side === 2) { x = -w / 2 - chairRadius - chairSpacingFromTable; y = 0; }
        else { x = w / 2 + chairRadius - chairSpacingFromTable; y = 0; }
        chairs.push({id: uuidv4(), x,y});
        placedChairs++;
        side = (side+1)%4;
    }

    return { chairs: chairs.slice(0, cap) };
  };

  const openGuestNumberDialog = (type: 'rect' | 'square' | 'circle') => {
    setTableTypeToAdd(type);
    setGuestCountInput(type === 'circle' ? "6" : type === 'square' ? "4" : "8"); // Default values
    setIsGuestNumberDialogOpen(true);
  };

  const handleConfirmAddTable = () => {
    const cap = parseInt(guestCountInput, 10) || 0;
    if (cap <= 0) {
        // Maybe show a toast later
        setIsGuestNumberDialogOpen(false);
        return;
    }

    let newTable: TableElement | null = null;
    const initialX = 200 + Math.random() * 100 - 50; // Add some randomness to position
    const initialY = 200 + Math.random() * 100 - 50;

    if (tableTypeToAdd === 'rect') {
      const width = 120;
      const height = 60;
      const { chairs } = generateRectChairs(width, height, cap);
      newTable = { id: uuidv4(), type: 'rect', x: initialX, y: initialY, width, height, capacity: cap, chairs };
    } else if (tableTypeToAdd === 'square') {
      const sideLength = 80;
      const { chairs } = generateRectChairs(sideLength, sideLength, cap);
      newTable = { id: uuidv4(), type: 'rect', x: initialX, y: initialY, width: sideLength, height: sideLength, capacity: cap, chairs };
    } else if (tableTypeToAdd === 'circle') {
      const radius = 50;
      const chairs: Chair[] = [];
      for (let i = 0; i < cap; i++) {
        const angle = (2 * Math.PI * i) / cap;
        chairs.push({ id: uuidv4(), x: Math.cos(angle) * (radius + 20), y: Math.sin(angle) * (radius + 20) });
      }
      newTable = { id: uuidv4(), type: 'circle', x: initialX, y: initialY, radius, capacity: cap, chairs };
    }

    if (newTable) {
      setTables(t => [...t, newTable!]);
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
        <div className="flex-grow relative bg-muted/50 rounded-md overflow-hidden">
          <Stage 
            width={typeof window !== 'undefined' ? window.innerWidth - 320 : 800} 
            height={typeof window !== 'undefined' ? window.innerHeight - 200 : 600} 
            onMouseDown={handleStageClick} 
            className="bg-white"
          >
            <Layer>
              {venueShape.length >= 4 && (
                <Line points={venueShape} closed stroke="#a1887f" strokeWidth={2} fill="#efebe9" />
              )}
              {tables.map(table => (
                <Group key={table.id} x={table.x} y={table.y} draggable
                  onDragEnd={(e) => {
                    setTables(prevTables => prevTables.map(t => 
                      t.id === table.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
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
                      offset={{ x: (table.width || 0) / 2, y: (table.height || 0) / 2 }}
                      shadowBlur={3}
                      shadowOpacity={0.2}
                      shadowOffsetX={1}
                      shadowOffsetY={1}
                    />
                  ) : (
                    <KonvaCircle // Use KonvaCircle to avoid conflict with Lucide icon
                      radius={table.radius}
                      fill="#d7ccc8"
                      stroke="#8d6e63"
                      strokeWidth={1.5}
                      offset={{ x: 0, y: 0 }}
                      shadowBlur={3}
                      shadowOpacity={0.2}
                      shadowOffsetX={1}
                      shadowOffsetY={1}
                    />
                  )}
                  {table.chairs.map(chair => (
                    <KonvaCircle // Use KonvaCircle here too
                        key={chair.id} 
                        x={chair.x} 
                        y={chair.y} 
                        radius={8} 
                        fill="#f5f5f5" 
                        stroke="#a1887f" 
                        strokeWidth={1} 
                    />
                  ))}
                </Group>
              ))}
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

    </div>
  );
}

