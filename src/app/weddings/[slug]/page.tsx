
// src/app/weddings/[slug]/page.tsx
import { db } from '@/lib/firebase-config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Wedding, WeddingPhoto, WeddingEvent } from '@/types/wedding';
import { notFound } from 'next/navigation';

import ElegantTemplate from '@/app/templates/wedding/elegant-template';
import ModernTemplate from '@/app/templates/wedding/modern-template';
import RusticTemplate from '@/app/templates/wedding/rustic-template';
import BaseTemplate from '@/app/templates/wedding/base-template'; // Fallback

interface WeddingPageProps {
  params: {
    slug: string;
  };
}

// Helper to convert Firestore Timestamps to JS Date objects or ISO strings
// For simplicity, templates can handle JS Date objects with date-fns
const transformWeddingDataForTemplate = (data: any): Partial<Wedding> => {
  const transformed: Partial<Wedding> = { ...data };
  if (data.date && data.date instanceof Timestamp) {
    transformed.date = data.date.toDate().toISOString();
  }
  if (data.rsvpDeadline && data.rsvpDeadline instanceof Timestamp) {
    transformed.rsvpDeadline = data.rsvpDeadline.toDate().toISOString();
  }
  // Ensure gallery and schedule are arrays
  transformed.gallery = Array.isArray(data.gallery) ? data.gallery : [];
  transformed.schedule = Array.isArray(data.schedule) ? data.schedule : [];
  
  return transformed;
};


async function getWeddingData(slug: string): Promise<Partial<Wedding> | null> {
  try {
    const weddingsRef = collection(db, 'weddings');
    const q = query(weddingsRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Assuming slug is unique, so we take the first document
    const weddingDoc = querySnapshot.docs[0];
    const weddingData = weddingDoc.data() as Wedding; // Firestore data
    
    // Transform data for template consumption
    return transformWeddingDataForTemplate({ id: weddingDoc.id, ...weddingData });

  } catch (error) {
    console.error("Error fetching wedding data by slug:", error);
    return null;
  }
}

export default async function WeddingSitePage({ params }: WeddingPageProps) {
  const { slug } = params;
  const weddingData = await getWeddingData(slug);

  if (!weddingData) {
    notFound(); // Triggers Next.js 404 page
  }

  // Select and render the template based on weddingData.templateId
  switch (weddingData.templateId) {
    case 'classic-elegance':
      return <ElegantTemplate wedding={weddingData} />;
    case 'modern-romance':
      return <ModernTemplate wedding={weddingData} />;
    case 'rustic-charm':
      return <RusticTemplate wedding={weddingData} />;
    default:
      // Fallback to a generic base template or a specific default if templateId is unknown
      console.warn(`Unknown templateId: ${weddingData.templateId}. Falling back to BaseTemplate.`);
      return <BaseTemplate wedding={weddingData}><p className="p-8 text-center">Wedding content will appear here based on the selected template.</p></BaseTemplate>;
  }
}

// Optional: Generate static paths if you know all possible slugs at build time
// export async function generateStaticParams() {
//   // Fetch all wedding slugs from Firestore
//   const weddingsRef = collection(db, "weddings");
//   const snapshot = await getDocs(weddingsRef);
//   return snapshot.docs.map((doc) => ({
//     slug: doc.data().slug,
//   }));
// }
