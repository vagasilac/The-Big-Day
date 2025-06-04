import type { Timestamp } from 'firebase/firestore';

export interface Guest {
  id?: string; // Firestore document ID
  weddingId: string; // Related wedding document
  name: string;
  email?: string;
  phone?: string;
  plusOneAllowed?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
