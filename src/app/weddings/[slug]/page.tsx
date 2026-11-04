import { notFound } from 'next/navigation';
import { isLocalMode } from '@/lib/data-mode';
import { getSampleWedding } from '@/lib/sample-wedding';
import { SAMPLE_SLUG } from '@/lib/wedding-options';
import WeddingSite from './wedding-site';

interface WeddingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WeddingSitePage({ params }: WeddingPageProps) {
  const { slug } = await params;

  if (!slug || typeof slug !== 'string') {
    notFound();
  }

  if (slug === SAMPLE_SLUG) {
    return <WeddingSite wedding={getSampleWedding()} sample />;
  }

  if (isLocalMode()) {
    return <WeddingSite slug={slug} />;
  }

  try {
    const { getWeddingBySlug } = await import('@/lib/firebase-wedding');
    const wedding = await getWeddingBySlug(slug);
    if (!wedding) notFound();
    return <WeddingSite wedding={wedding} />;
  } catch (error) {
    console.error(`Error fetching wedding data by slug "${slug}":`, error);
    notFound();
  }
}
