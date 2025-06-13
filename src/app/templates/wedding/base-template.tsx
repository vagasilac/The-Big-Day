
'use client'; 

import React from 'react';
import type { Wedding } from '@/types/wedding';
import type { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Heart } from 'lucide-react';
import Image from 'next/image';

interface BaseTemplateProps {
  wedding: Partial<Wedding>;
  children?: React.ReactNode;
  isPreviewMode?: boolean;
}

const toDate = (val?: Timestamp | string | Date | null) => {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return val.toDate();
};

const BaseTemplate: React.FC<BaseTemplateProps> = ({ wedding, children, isPreviewMode }) => {
  const formattedDate = wedding.date
    ? format(toDate(wedding.date)!, "EEEE, MMMM do, yyyy 'at' h:mm a")
    : 'Date to be announced';

  const titleClassName = isPreviewMode
    ? "text-2xl md:text-3xl font-bold mb-3" // Smaller size for preview
    : "text-4xl md:text-6xl font-bold mb-4"; // Original size

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section
        className="relative py-20 md:py-32 bg-cover bg-center text-white"
        style={{
          backgroundImage: wedding.coverPhoto
            ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${wedding.coverPhoto})`
            : 'linear-gradient(rgba(var(--primary-hsl)/0.7), rgba(var(--primary-hsl)/0.9))',
        }}
      >
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className={titleClassName} style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            {wedding.title || "Our Wedding Day"}
          </h1>
          {!isPreviewMode && <div className="w-24 h-1 bg-white mx-auto my-6 opacity-75"></div>}
          <p className="text-xl md:text-2xl mb-2">
            {formattedDate}
          </p>
          <p className="text-lg md:text-xl">
            {wedding.location || 'Venue to be Announced'}
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      {wedding.description && (
        <section className="py-12 md:py-16 bg-card text-card-foreground">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              Our Story
            </h2>
            <Heart className="h-8 w-8 text-primary mx-auto mb-6" />
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
              {wedding.description}
            </p>
          </div>
        </section>
      )}

      {/* Custom Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-10 bg-secondary text-secondary-foreground text-center border-t border-border">
        <div className="container mx-auto px-6">
          <Heart className="h-6 w-6 text-primary mx-auto mb-3" />
          <p className="text-lg mb-2">
            {wedding.title || "Celebrating Our Love"}
          </p>
          <p className="text-sm text-muted-foreground">
            We can&apos;t wait to celebrate with you!
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BaseTemplate;
