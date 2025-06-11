
import type { Timestamp } from 'firebase/firestore';

// Represents a single photo in a gallery
export interface WeddingPhoto {
  id: string;
  url: string;
  description?: string;
  dataAiHint?: string; // For AI-assisted image searching
}

// Represents a single event in the wedding schedule
export interface WeddingEvent {
  time: string;
  event: string;
  description?: string;
}

// Main Wedding data structure
export interface Wedding {
  id?: string; // Firestore document ID
  userId: string; // Firebase Auth User UID
  title: string;
  slug: string; // User-defined URL slug
  date?: Timestamp | null; // Combined date and time, stored as Firestore Timestamp
  location?: string;
  description?: string;
  coverPhoto?: string; // URL to the cover photo
  templateId: string; // Identifier for the chosen template
  gallery?: WeddingPhoto[];
  schedule?: WeddingEvent[];
  dressCode?: string;
  rsvpDeadline?: Timestamp | null;
  selectedVenueLayoutId?: string; // ID of the VenueLayout selected for seating
  seatingArrangementId?: string; // ID of the specific SeatingArrangement document
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
