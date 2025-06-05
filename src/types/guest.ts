
import type { Timestamp } from 'firebase/firestore';

export interface Guest {
  id?: string; // Firestore document ID
  weddingId: string; // Related wedding document
  name: string;
  email?: string;
  phone?: string;
  plusOneAllowed?: boolean; // For primary guest: can they bring a plus one?
  category?: "bride's" | "bridegroom's" | 'shared' | 'service';
  relationship?: 'family' | 'friend' | 'colleague' | 'service' | 'plus-one';
  familyGroup?: string;
  headOfFamily?: boolean;
  plusOneName?: string; // For primary guest: name of their plus one
  invitedTo?: string[];
  invitationStatus?: 'sent' | 'not_sent';
  rsvpStatus?: 'pending' | 'accepted' | 'declined' | 'maybe';
  personalMessage?: string;
  mealChoice?: string | null;
  invitationCode?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isPlusOneFor?: string; // ID of the primary guest if this is a plus-one
}
