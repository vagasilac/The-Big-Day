
'use client';

import React from 'react';
import type { Wedding } from '@/types/wedding';
import type { Timestamp } from 'firebase/firestore';
import BaseTemplate from './base-template';
import { greatVibes, cormorantGaramond } from '../../../lib/fonts'; 
import { Calendar, MapPin, Heart, Camera, Users, Gift } from 'lucide-react';
import Image from 'next/image';

interface ElegantTemplateProps {
  wedding: Partial<Wedding>;
  isPreviewMode?: boolean;
}

const toDate = (val?: Timestamp | string | Date | null) => {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return val.toDate();
};

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({ wedding, isPreviewMode }) => {
  return (
    <BaseTemplate wedding={wedding} isPreviewMode={isPreviewMode}>
      <div className={`${cormorantGaramond.variable} font-sans`}>
        {/* Details Section */}
        <section className="py-12 md:py-16 bg-background text-foreground">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <h2 className={`${greatVibes.variable} font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-10 md:mb-12 text-primary`}>
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="text-center p-4 sm:p-6 bg-card rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 text-card-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Ceremony & Reception</h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-1">
                  {wedding.date
                    ? toDate(wedding.date)?.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Date to be announced'}
                </p>
                <p className="text-base sm:text-lg text-muted-foreground">
                  {wedding.date
                    ? toDate(wedding.date)?.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Time to be announced'}
                </p>
              </div>

              <div className="text-center p-4 sm:p-6 bg-card rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 text-card-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Venue</h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-1">
                  {wedding.location || 'Venue to be announced'}
                </p>
                {/* Placeholder address, consider making this part of Wedding data model */}
                <p className="text-sm sm:text-md text-muted-foreground">
                  123 Celebration Avenue, Dream City, DC 45678
                </p>
              </div>
            </div>
            {wedding.dressCode && (
                 <div className="mt-10 md:mt-12 text-center p-4 sm:p-6 bg-card rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 sm:mb-6">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 text-card-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Dress Code</h3>
                    <p className="text-base sm:text-lg text-muted-foreground">{wedding.dressCode}</p>
                </div>
            )}
          </div>
        </section>

        {/* Schedule Section */}
        {wedding.schedule && wedding.schedule.length > 0 && (
          <section className="py-12 md:py-16 bg-secondary text-secondary-foreground">
            <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
              <h2 className={`${greatVibes.variable} font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-10 md:mb-12 text-primary`}>
                Our Day&apos;s Schedule
              </h2>
              <div className="space-y-6 md:space-y-8">
                {wedding.schedule.map((item, index) => (
                  <div key={index} className="flex">
                    <div className="w-1/4 text-right pr-4 md:pr-6">
                      <p className="text-base sm:text-lg font-semibold text-primary">{item.time}</p>
                    </div>
                    <div className="w-3/4 pl-4 md:pl-6 border-l-2 border-primary/30">
                      <h4 className="text-lg sm:text-xl font-semibold mb-1 text-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{item.event}</h4>
                      {item.description && <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {wedding.gallery && wedding.gallery.length > 0 && (
        <section className="py-12 md:py-16 bg-background text-foreground">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <h2 className={`${greatVibes.variable} font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-10 md:mb-12 text-primary`}>
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {wedding.gallery.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Wedding gallery image'}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    data-ai-hint="wedding photo"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* RSVP Section */}
        <section className="py-12 md:py-16 bg-primary/5 text-foreground">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-4 sm:mb-6">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h2 className={`${greatVibes.variable} font-serif text-3xl sm:text-4xl md:text-5xl text-center mb-4 sm:mb-6 text-primary`}>
              Will You Be Joining Us?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 md:mb-8">
              Please RSVP by {wedding.rsvpDeadline ? toDate(wedding.rsvpDeadline)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the deadline'} so we can finalize our arrangements.
            </p>
            <button className="px-8 sm:px-10 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 transition-colors text-base sm:text-lg font-semibold">
              RSVP Now
            </button>
            <div className="mt-8 sm:mt-12 flex justify-center">
              <Heart className="text-primary h-6 w-6 sm:h-8 sm:w-8" />
            </div>
          </div>
        </section>
      </div>
    </BaseTemplate>
  );
};

export default ElegantTemplate;
