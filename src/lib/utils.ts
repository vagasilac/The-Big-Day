import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize numeric fields for venue layouts fetched from Firestore
// Firestore may return numbers or strings depending on how data was stored
// This helper ensures we always work with proper numbers in the app
import type { VenueLayout, TableElement, Chair } from '@/types/venue'

export function normalizeVenueLayout(raw: any): VenueLayout {
  const normalizeChair = (c: any): Chair => ({
    id: c.id,
    x: typeof c.x === 'string' ? parseFloat(c.x) : c.x ?? 0,
    y: typeof c.y === 'string' ? parseFloat(c.y) : c.y ?? 0,
  });

  const normalizeTable = (t: any): TableElement => ({
    id: t.id,
    type: t.type,
    x: typeof t.x === 'string' ? parseFloat(t.x) : t.x ?? 0,
    y: typeof t.y === 'string' ? parseFloat(t.y) : t.y ?? 0,
    width: typeof t.width === 'string' ? parseFloat(t.width) : t.width ?? 0,
    height: typeof t.height === 'string' ? parseFloat(t.height) : t.height ?? 0,
    radius:
      t.radius !== undefined
        ? typeof t.radius === 'string'
          ? parseFloat(t.radius)
          : t.radius
        : undefined,
    rotation: typeof t.rotation === 'string' ? parseFloat(t.rotation) : t.rotation ?? 0,
    capacity: typeof t.capacity === 'string' ? parseInt(t.capacity, 10) : t.capacity ?? 0,
    chairs: Array.isArray(t.chairs) ? t.chairs.map(normalizeChair) : [],
    displayOrderNumber:
      typeof t.displayOrderNumber === 'string'
        ? parseInt(t.displayOrderNumber, 10)
        : t.displayOrderNumber ?? 0,
    label: t.label,
  });

  return {
    ...raw,
    tables: Array.isArray(raw.tables) ? raw.tables.map(normalizeTable) : [],
    venueShape: Array.isArray(raw.venueShape)
      ? raw.venueShape.map((v: any) => (typeof v === 'string' ? parseFloat(v) : v))
      : [],
  } as VenueLayout;
}

