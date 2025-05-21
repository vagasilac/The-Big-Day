
// src/app/weddings/[slug]/page.tsx
import { db } from '@/lib/firebase-config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Wedding } from '@/types/wedding';
import { notFound } from 'next/navigation';

import ElegantTemplate from '@/app/templates/wedding/elegant-template';
import ModernTemplate from '@/app/templates/wedding/modern-template';
import RusticTemplate from '@/app/templates/wedding/rustic-template';
import BaseTemplate from '@/app/templates/wedding/base-template';

interface WeddingPageProps {
  params: {
    slug: string;
  };
}

const transformWeddingDataForTemplate = (data: any): Partial<Wedding> => {
  const transformed: Partial<Wedding> = { ...data };
  if (data.date && data.date instanceof Timestamp) {
    transformed.date = data.date.toDate().toISOString();
  }
  if (data.rsvpDeadline && data.rsvpDeadline instanceof Timestamp) {
    transformed.rsvpDeadline = data.rsvpDeadline.toDate().toISOString();
  }
  // Ensure gallery and schedule are arrays, even if undefined in Firestore
  transformed.gallery = Array.isArray(data.gallery) ? data.gallery : [];
  transformed.schedule = Array.isArray(data.schedule) ? data.schedule : [];
  
  return transformed;
};


async function getWeddingData(slug: string): Promise<Partial<Wedding> | null> {
  try {
    const weddingsRef = collection(db, 'weddings');
    // Ensure the slug being queried matches exactly what's in Firestore (case-sensitive)
    const q = query(weddingsRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // This console.log will appear in your Next.js server logs, not the browser
      console.log(`No wedding found for slug: ${slug} in Firestore.`);
      return null;
    }

    const weddingDoc = querySnapshot.docs[0];
    const weddingDataFromDb = weddingDoc.data() as Wedding; 
    
    return transformWeddingDataForTemplate({ id: weddingDoc.id, ...weddingDataFromDb });

  } catch (error) {
    console.error(`Error fetching wedding data by slug "${slug}":`, error);
    return null;
  }
}

export default async function WeddingSitePage({ params }: WeddingPageProps) {
  const { slug } = params;

  if (!slug || typeof slug !== 'string') {
    console.error('Invalid or missing slug parameter.');
    notFound();
    return; // Explicit return after notFound
  }
  
  const weddingData = await getWeddingData(slug);

  if (!weddingData) {
    notFound(); // Triggers Next.js 404 page
    return; // Explicit return after notFound
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
      console.warn(`Unknown templateId: "${weddingData.templateId}" for slug "${slug}". Falling back to BaseTemplate.`);
      return <BaseTemplate wedding={weddingData}><p className="p-8 text-center">Wedding content will appear here based on the selected template.</p></BaseTemplate>;
  }
}

// Optional: Generate static paths if you know all possible slugs at build time
// export async function generateStaticParams() {
//   // Fetch all wedding slugs from Firestore
//   try {
//     const weddingsRef = collection(db, "weddings");
//     const snapshot = await getDocs(weddingsRef);
//     return snapshot.docs.map((doc) => ({
//       slug: doc.data().slug,
//     }));
//   } catch (error) {
//     console.error("Error generating static params for wedding slugs:", error);
//     return [];
//   }
// }

// Ensure revalidation if content changes frequently, or use on-demand revalidation
// export const revalidate = 60; // Revalidate at most every 60 seconds

