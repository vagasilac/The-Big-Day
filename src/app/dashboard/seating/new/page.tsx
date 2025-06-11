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

  const handleAddRectangleTable = () => {
    const cap = parseInt(prompt('Number of guests for this table?', '8') || '8', 10);
    const width = 120;
    const height = 60;
    const { chairs } = generateRectChairs(width, height, cap);
    setTables(t => [...t, { id: uuidv4(), type: 'rect', x: 200, y: 200, width, height, capacity: cap, chairs }]);
  };

  const handleAddCircleTable = () => {
    const cap = parseInt(prompt('Number of guests for this table?', '8') || '8', 10);
    const radius = 60;
    const { chairs } = generateRoundChairs(radius, cap);
    setTables(t => [...t, { id: uuidv4(), type: 'circle', x: 300, y: 300, radius, capacity: cap, chairs }]);
  };

  const generateRectChairs = (w: number, h: number, cap: number) => {
    const chairs: Chair[] = [];
    const perSide = Math.ceil(cap / 4);
    const spacingX = w / (perSide + 1);
    const spacingY = h / (perSide + 1);
    for (let i = 0; i < perSide; i++) {
      chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: -h / 2 - 20 }); // top
      chairs.push({ id: uuidv4(), x: (i + 1) * spacingX - w / 2, y: h / 2 + 20 }); // bottom
      chairs.push({ id: uuidv4(), x: -w / 2 - 20, y: (i + 1) * spacingY - h / 2 }); // left
      chairs.push({ id: uuidv4(), x: w / 2 + 20, y: (i + 1) * spacingY - h / 2 }); // right
    }
    return { chairs: chairs.slice(0, cap) };
  };

  const generateRoundChairs = (r: number, cap: number) => {
    const chairs: Chair[] = [];
    for (let i = 0; i < cap; i++) {
      const angle = (2 * Math.PI * i) / cap;
      chairs.push({ id: uuidv4(), x: Math.cos(angle) * (r + 30), y: Math.sin(angle) * (r + 30) });
    }
    return { chairs };
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
        <h1 className="text-2xl font-bold tracking-tight">Create Venue Layout</h1>
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
          </CardContent>
        </Card>
        <div className="flex-grow relative bg-muted/50 rounded-md overflow-hidden">
          <Stage width={1000} height={700} onMouseDown={handleStageClick} className="bg-white">
            <Layer>
              {venueShape.length >= 4 && (
                <Line points={venueShape} closed stroke="black" strokeWidth={2} fill="#f0f0f0" />
              )}
              {tables.map(table => (
                <Group key={table.id} x={table.x} y={table.y} draggable>
                  {table.type === 'rect' ? (
                    <Rect
                      width={table.width}
                      height={table.height}
                      fill="#ddd"
                      stroke="black"
                      strokeWidth={2}
                      offset={{ x: (table.width || 0) / 2, y: (table.height || 0) / 2 }}
                    />
                  ) : (
                    <Circle
                      radius={table.radius}
                      fill="#ddd"
                      stroke="black"
                      strokeWidth={2}
                      offset={{ x: 0, y: 0 }}
                    />
                  )}
                  {table.chairs.map(chair => (
                    <Circle key={chair.id} x={chair.x} y={chair.y} radius={8} fill="#fff" stroke="black" />
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

