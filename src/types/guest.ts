import type { Timestamp } from 'firebase/firestore';

export interface Guest {
  id?: string; // Firestore document ID
  weddingId: string; // Related wedding document
  name: string;
  email?: string;
  phone?: string;
  plusOneAllowed?: boolean;
  category?: "bride's" | "bridegroom's" | 'shared' | 'service';
  relationship?: 'family' | 'friend' | 'colleague' | 'service';
  familyGroup?: string;
  headOfFamily?: boolean;
  plusOneName?: string;
  invitedTo?: string[];
  invitationStatus?: 'sent' | 'not_sent';
  rsvpStatus?: 'pending' | 'accepted' | 'declined';
  mealChoice?: string | null;
  invitationCode?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
