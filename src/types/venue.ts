
import type { Timestamp } from 'firebase/firestore';

export interface VenueLayout {
  id: string; // Firestore document ID or mock ID
  name: string;
  description?: string;
  ownerId?: string; // UID of the venue owner, or 'system' for default templates
  capacity?: number;
  previewImageUrl?: string; // URL for a thumbnail/preview of the layout
  // dimensions?: { width: number; height: number; unit: 'm' | 'ft' }; // For later
  // elements?: any[]; // For later: walls, doors, tables as raw data
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// We can expand this later with TableElement, SeatElement, etc.
// export type TableShape = 'rectangle' | 'round' | 'square';

// export interface TableElement {
//   id: string;
//   shape: TableShape;
//   position: { x: number; y: number };
//   width?: number; 
//   height?: number;
//   radius?: number;
//   rotation?: number;
//   capacity: number;
//   seats: SeatElement[]; // Seats associated with this table
// }

// export interface SeatElement {
//   id: string;
//   // position relative to table or absolute?
//   guestId?: string | null; 
// }

// export interface SeatingArrangement {
//   id?: string; // Firestore document ID
//   weddingId: string;
//   venueLayoutId: string; // Reference to the base VenueLayout
//   customizedTables?: TableElement[]; // If tables are moved/added/removed from base layout
//   seatAssignments?: Record<string, string>; // seatId: guestId
//   notes?: string;
//   updatedAt?: Timestamp;
// }
