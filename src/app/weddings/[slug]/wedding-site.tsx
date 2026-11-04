'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase-config';
import { collection, getDocs, query, where } from '@/lib/backend/firestore';
import type { Wedding } from '@/types/wedding';
import ElegantTemplate from '@/app/templates/wedding/elegant-template';
import ModernTemplate from '@/app/templates/wedding/modern-template';
import RusticTemplate from '@/app/templates/wedding/rustic-template';
import BaseTemplate from '@/app/templates/wedding/base-template';
import { Heart } from 'lucide-react';

interface WeddingSiteProps {
  wedding?: Partial<Wedding> | null;
  slug?: string;
  sample?: boolean;
}

function Template({ wedding, sample }: { wedding: Partial<Wedding>; sample?: boolean }) {
  const props = { wedding, sample };
  switch (wedding.templateId) {
    case 'classic-elegance':
      return <ElegantTemplate {...props} />;
    case 'modern-romance':
      return <ModernTemplate {...props} />;
    case 'rustic-charm':
      return <RusticTemplate {...props} />;
    default:
      return (
        <BaseTemplate wedding={wedding} sample={sample}>
          <p className="p-8 text-center">This wedding has no template selected yet.</p>
        </BaseTemplate>
      );
  }
}

export default function WeddingSite({ wedding: initial, slug, sample }: WeddingSiteProps) {
  const [wedding, setWedding] = useState<Partial<Wedding> | null>(initial || null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(!initial && !!slug);

  useEffect(() => {
    if (initial || !slug) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'weddings'), where('slug', '==', slug)));
        if (cancelled) return;
        if (snap.empty) {
          setMissing(true);
        } else {
          const first = snap.docs[0];
          setWedding({ id: first.id, ...first.data() } as Wedding);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial, slug]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-muted-foreground">
        <Heart className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (missing || !wedding) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center">
        <Heart className="h-10 w-10 text-primary mb-4" />
        <h1 className="text-3xl mb-2">Wedding site not found</h1>
        <p className="text-muted-foreground max-w-md">
          There is no website for this link in this browser. If you are using the phone preview, open the site from the same phone that created it.
        </p>
      </div>
    );
  }

  return (
    <>
      {sample && (
        <div className="bg-amber-100 text-amber-950 text-center text-sm px-4 py-2">
          Sample website. The names, date, and venue are placeholders, not a real wedding.
        </div>
      )}
      <Template wedding={wedding} sample={sample} />
    </>
  );
}
