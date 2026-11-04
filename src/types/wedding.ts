
import type { Timestamp } from '@/lib/backend/firestore';

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

export interface RegistryLink {
  id: string;
  name: string;
  url: string;
  note?: string;
}

export interface SongSuggestion {
  id: string;
  title: string;
  artist?: string;
  suggestedBy?: string;
  votes: number;
}

// Main Wedding data structure
export interface Wedding {
  id?: string; // Firestore document ID
  userId: string; // Firebase Auth User UID
  title: string;
  slug: string; // User-defined URL slug
  date?: Timestamp | string | null; // Firestore Timestamp, or an ISO string on public pages
  location?: string;
  address?: string;
  description?: string;
  coverPhoto?: string; // URL to the cover photo
  templateId: string; // Identifier for the chosen template
  /** HSL components, for example "340 60% 75%". Applied as the site accent. */
  accentColor?: string;
  gallery?: WeddingPhoto[];
  schedule?: WeddingEvent[];
  registry?: RegistryLink[];
  songs?: SongSuggestion[];
  dressCode?: string;
  rsvpDeadline?: Timestamp | string | null;
  selectedVenueLayoutId?: string; // ID of the VenueLayout selected for seating
  seatingArrangementId?: string; // ID of the specific SeatingArrangement document
  seatingAssignments?: Record<string, { guestId: string; guestName: string }>; // Stores chairId -> guest mapping
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

