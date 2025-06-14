import type { Timestamp } from 'firebase/firestore';

export interface Obstacle {
  id: string;
  type: 'rect' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  label?: string;
}

export interface TableTemplate {
  id: string;
  type: 'rect' | 'circle';
  width: number;
  height: number;
  radius?: number;
  capacity: number;
  quantity: number;
}

export interface VenueBlueprint {
  id?: string; // Firestore document ID
  name: string;
  description?: string;
  ownerId: string;
  isPublic?: boolean;
  unit: string; // e.g., 'm', 'ft'
  venueShape: number[]; // polygon defining the venue walls
  obstacles?: Obstacle[];
  tables: TableTemplate[]; // table definitions with quantities
  maxCapacity: number; // overall maximum guest capacity
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

