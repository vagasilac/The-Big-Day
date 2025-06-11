
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stage, Layer, Rect, Circle, Group, Line } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Square, Circle as CircleIcon, ArrowLeft } from 'lucide-react';

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

  const generateRectChairs = (w: number, h: number, cap: number) => {
    const chairs: Chair[] = [];
    if (cap === 0) return { chairs };

    const numSides = 4;
    let chairsPerLongSide = 0;
    let chairsPerShortSide = 0;

    if (w === h) { // Square table
        chairsPerLongSide = Math.ceil(cap / numSides);
        chairsPerShortSide = chairsPerLongSide;
    } else { // Rectangle table
        // Prioritize longer sides for more chairs
        const longSidesRatio = w > h ? 2 * (w / (w+h)) : 2 * (h / (w+h));
        const shortSidesRatio = 2 - longSidesRatio;
        
        chairsPerLongSide = Math.ceil((cap * (w > h ? longSidesRatio : shortSidesRatio)) / 2);
        chairsPerShortSide = Math.ceil((cap * (w < h ? longSidesRatio : shortSidesRatio)) / 2);

        // Ensure total does not exceed capacity and adjust if needed
        if (chairsPerLongSide*2 + chairsPerShortSide*2 > cap) {
            // simple adjustment: reduce from shorter side first or equally
           if (w > h) { // long sides are w
             chairsPerLongSide = Math.floor(cap / 2 / 2) + (cap % 4 >= 1 ? 1 : 0);
             chairsPerShortSide = Math.floor(cap / 2 / 2) + (cap % 4 >= 2 ? 1 : 0) ;
           } else { // long sides are h
             chairsPerShortSide = Math.floor(cap / 2 / 2) + (cap % 4 >= 1 ? 1 : 0);
             chairsPerLongSide = Math.floor(cap / 2 / 2) + (cap % 4 >= 2 ? 1 : 0) ;
           }
        }
         // Fallback if calculation is off, distribute as evenly as possible
        if (chairsPerLongSide * 2 + chairsPerShortSide * 2 !== cap && cap > 0) {
            chairsPerLongSide = Math.ceil(cap/4);
            chairsPerShortSide = Math.ceil(cap/4);
            if (chairsPerLongSide * 2 + chairsPerShortSide * 2 > cap + 1 && cap > 1) { // allow one extra if cap is odd
                 chairsPerLongSide = Math.floor(cap/4);
                 chairsPerShortSide = Math.floor(cap/4);
            }
        }

    }
    
    const chairRadius = 8; // Radius of the chair circle
    const chairSpacing = 5; // Spacing from table edge

    // Top side (along width, y = -height/2)
    if (chairsPerLongSide > 0) {
        const spacingX = w / (chairsPerLongSide + 1);
        for (let i = 0; i < chairsPerLongSide; i++) {
          if (chairs.length < cap) chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: -h / 2 - chairRadius - chairSpacing });
        }
    }

    // Bottom side (along width, y = height/2)
    if (chairsPerLongSide > 0) {
        const spacingX = w / (chairsPerLongSide + 1);
        for (let i = 0; i < chairsPerLongSide; i++) {
          if (chairs.length < cap) chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: h / 2 + chairRadius + chairSpacing });
        }
    }
    
    // Left side (along height, x = -width/2)
    if (chairsPerShortSide > 0) {
        const spacingY = h / (chairsPerShortSide + 1);
        for (let i = 0; i < chairsPerShortSide; i++) {
          if (chairs.length < cap) chairs.push({ id: uuidv4(), x: -w / 2 - chairRadius - chairSpacing, y: (i + 1) * spacingY - h / 2 });
        }
    }

    // Right side (along height, x = width/2)
    if (chairsPerShortSide > 0) {
        const spacingY = h / (chairsPerShortSide + 1);
        for (let i = 0; i < chairsPerShortSide; i++) {
          if (chairs.length < cap) chairs.push({ id: uuidv4(), x: w / 2 + chairRadius + chairSpacing, y: (i + 1) * spacingY - h / 2 });
        }
    }
    // If still not enough chairs due to rounding, fill remaining up to cap, preferring longer sides
    let currentChairs = chairs.length;
    let attemptSide = 0; // 0:top, 1:bottom, 2:left, 3:right
    while(currentChairs < cap && chairs.length < cap * 1.5) { // safety break
        if (attemptSide === 0 || attemptSide === 1) { // top or bottom
             const yPos = attemptSide === 0 ? (-h/2 - chairRadius - chairSpacing) : (h/2 + chairRadius + chairSpacing);
             // Add chair at midpoint of remaining space
             chairs.push({id: uuidv4(), x: 0, y: yPos});
        } else { // left or right
            const xPos = attemptSide === 2 ? (-w/2 - chairRadius - chairSpacing) : (w/2 + chairRadius + chairSpacing);
            chairs.push({id: uuidv4(), x: xPos, y: 0});
        }
        currentChairs++;
        attemptSide = (attemptSide + 1) % 4;
    }

    return { chairs: chairs.slice(0, cap) };
  };


  const handleAddRectangleTable = () => {
    const cap = parseInt(prompt('Number of guests for this rectangle table?', '8') || '8', 10);
    const width = 120;
    const height = 60;
    const { chairs } = generateRectChairs(width, height, cap);
    setTables(t => [...t, { id: uuidv4(), type: 'rect', x: 200, y: 200, width, height, capacity: cap, chairs }]);
  };

  const handleAddSquareTable = () => {
    const cap = parseInt(prompt('Number of guests for this square table?', '4') || '4', 10);
    const sideLength = 80;
    const { chairs } = generateRectChairs(sideLength, sideLength, cap); // Use same logic for square
    setTables(t => [...t, { id: uuidv4(), type: 'rect', x: 250, y: 250, width: sideLength, height: sideLength, capacity: cap, chairs }]);
  };

  const handleAddCircleTable = () => {
    const cap = parseInt(prompt('Number of guests for this round table?', '6') || '6', 10);
    const radius = 50; // slightly smaller for rounder look with 6-8 chairs
    const chairs: Chair[] = [];
    for (let i = 0; i < cap; i++) {
      const angle = (2 * Math.PI * i) / cap;
      chairs.push({ id: uuidv4(), x: Math.cos(angle) * (radius + 20), y: Math.sin(angle) * (radius + 20) });
    }
    setTables(t => [...t, { id: uuidv4(), type: 'circle', x: 300, y: 300, radius, capacity: cap, chairs }]);
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
            <Button className="w-full" onClick={handleAddRectangleTable}>
              <Square className="mr-2 h-4 w-4" /> Add Rect Table
            </Button>
            <Button className="w-full" onClick={handleAddSquareTable}>
              <Square className="mr-2 h-4 w-4" /> Add Square Table
            </Button>
            <Button className="w-full" onClick={handleAddCircleTable}>
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
             {/* TODO: Implement Save Layout button */}
             <Button className="w-full mt-4" variant="default" disabled>Save Layout</Button>
          </CardContent>
        </Card>
        <div className="flex-grow relative bg-muted/50 rounded-md overflow-hidden">
          <Stage width={window.innerWidth - 320} height={window.innerHeight - 200} onMouseDown={handleStageClick} className="bg-white">
            <Layer>
              {venueShape.length >= 4 && (
                <Line points={venueShape} closed stroke="black" strokeWidth={2} fill="#f0f0f0" />
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
                      fill="#d1c4e9" // Softer purple
                      stroke="#5e35b1" // Darker purple
                      strokeWidth={1.5}
                      cornerRadius={4}
                      offset={{ x: (table.width || 0) / 2, y: (table.height || 0) / 2 }}
                      shadowBlur={5}
                      shadowOpacity={0.3}
                      shadowOffsetX={2}
                      shadowOffsetY={2}
                    />
                  ) : (
                    <Circle
                      radius={table.radius}
                      fill="#d1c4e9"
                      stroke="#5e35b1"
                      strokeWidth={1.5}
                      offset={{ x: 0, y: 0 }}
                      shadowBlur={5}
                      shadowOpacity={0.3}
                      shadowOffsetX={2}
                      shadowOffsetY={2}
                    />
                  )}
                  {table.chairs.map(chair => (
                    <Circle key={chair.id} x={chair.x} y={chair.y} radius={8} fill="#ede7f6" stroke="#7e57c2" strokeWidth={1} />
                  ))}
                </Group>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
