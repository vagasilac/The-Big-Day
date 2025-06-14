"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '@/lib/firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { VenueBlueprint, TableTemplate } from '@/types/blueprint';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function NewBlueprintPage() {
  const router = useRouter();
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [drawing, setDrawing] = useState(false);
  const [shapePoints, setShapePoints] = useState<number[]>([]);
  const [unit, setUnit] = useState('m');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('0');
  const [tables, setTables] = useState<TableTemplate[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById('blueprint-canvas');
      if (el) setStageSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.05;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStageScale(newScale);
    setStagePos(newPos);
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawing) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;
    setShapePoints(prev => [...prev, point.x, point.y]);
  };

  const saveBlueprint = async () => {
    if (!userId) return;
    const data: VenueBlueprint = {
      name,
      ownerId: userId,
      unit,
      venueShape: shapePoints,
      tables,
      maxCapacity: parseInt(capacity, 10) || 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await addDoc(collection(db, 'venueBlueprints'), data);
    router.push('/dashboard/blueprints');
  };

  const addTableTemplate = () => {
    setTables(prev => [
      ...prev,
      { id: uuidv4(), type: 'circle', width: 0, height: 0, capacity: 0, quantity: 1 },
    ]);
  };

  const updateTableField = (id: string, field: keyof TableTemplate, value: string) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, [field]: field === 'capacity' || field === 'quantity' ? parseInt(value,10) || 0 : value } : t));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-4">New Venue Blueprint</h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="w-full lg:w-1/3">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Unit (m/ft)" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <Input placeholder="Max Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" />
            <Button type="button" onClick={addTableTemplate}>Add Table Type</Button>
            {tables.map(t => (
              <div key={t.id} className="grid grid-cols-2 gap-2">
                <Input placeholder="Type (rect/circle)" value={t.type} onChange={e => updateTableField(t.id, 'type', e.target.value)} />
                <Input placeholder="Width" value={t.width} onChange={e => updateTableField(t.id, 'width', e.target.value)} />
                <Input placeholder="Height" value={t.height} onChange={e => updateTableField(t.id, 'height', e.target.value)} />
                <Input placeholder="Capacity" value={t.capacity} onChange={e => updateTableField(t.id, 'capacity', e.target.value)} type="number" />
                <Input placeholder="Quantity" value={t.quantity} onChange={e => updateTableField(t.id, 'quantity', e.target.value)} type="number" />
              </div>
            ))}
            <Button onClick={saveBlueprint}>Save Blueprint</Button>
          </CardContent>
        </Card>
        <div id="blueprint-canvas" className="flex-1 relative border rounded-md overflow-hidden">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onClick={handleClick}
            className="bg-white"
          >
            <Layer>{shapePoints.length >= 4 && <Line points={shapePoints} closed stroke="#3f51b5" strokeWidth={2} />}</Layer>
          </Stage>
          <div className="absolute top-2 left-2 flex gap-2">
            <Button size="sm" onClick={() => setDrawing(d => !d)}>{drawing ? 'Stop Drawing' : 'Draw Walls'}</Button>
            <Button size="sm" variant="outline" onClick={() => { setShapePoints([]); setStageScale(1); setStagePos({x:0,y:0}); }}>Reset</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

