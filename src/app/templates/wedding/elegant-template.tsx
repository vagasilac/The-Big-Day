
'use client';

import React from 'react';
import type { Wedding } from '@/types/wedding';
import BaseTemplate from './base-template'; // Relative path
import { greatVibes, cormorantGaramond } from '../../../lib/fonts'; // Relative path
import { Calendar, MapPin, Heart, Camera, Users, Gift } from 'lucide-react';
import Image from 'next/image';

interface ElegantTemplateProps {
  wedding: Partial<Wedding>;
}

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({ wedding }) => {
  return (
    <BaseTemplate wedding={wedding}>
      <div className={`${cormorantGaramond.variable} font-sans`}>
        {/* Details Section */}
        <section className="py-16 md:py-20 bg-background text-foreground">
          <div className="container mx-auto px-6 max-w-5xl">
            <h2 className={`${greatVibes.variable} font-serif text-4xl md:text-5xl text-center mb-12 md:mb-16 text-primary`}>
              Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="text-center p-6 md:p-8 bg-card rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-card-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Ceremony & Reception</h3>
                <p className="text-lg text-muted-foreground mb-1">
                  {wedding.date
                    ? new Date(wedding.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Date to be announced'}
                </p>
                <p className="text-lg text-muted-foreground">
                  {wedding.date
                    ? new Date(wedding.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Time to be announced'}
                </p>
              </div>

              <div className="text-center p-6 md:p-8 bg-card rounded-lg shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-card-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Venue</h3>
                <p className="text-lg text-muted-foreground mb-1">
                  {wedding.location || 'Venue to be announced'}
                </p>
                {/* Placeholder address, consider making this part of Wedding data model */}
                <p className="text-md text-muted-foreground">
                  123 Celebration Avenue, Dream City, DC 45678
                </p>
              </div>
            </div>
            {wedding.dressCode && (
                 <div className="mt-12 text-center p-6 md:p-8 bg-card rounded-lg shadow-lg max-w-md mx-auto">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-card-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Dress Code</h3>
                    <p className="text-lg text-muted-foreground">{wedding.dressCode}</p>
                </div>
            )}
          </div>
        </section>

        {/* Schedule Section */}
        {wedding.schedule && wedding.schedule.length > 0 && (
          <section className="py-16 md:py-20 bg-secondary text-secondary-foreground">
            <div className="container mx-auto px-6 max-w-4xl">
              <h2 className={`${greatVibes.variable} font-serif text-4xl md:text-5xl text-center mb-12 md:mb-16 text-primary`}>
                Our Day&apos;s Schedule
              </h2>
              <div className="space-y-8">
                {wedding.schedule.map((item, index) => (
                  <div key={index} className="flex">
                    <div className="w-1/4 text-right pr-6">
                      <p className="text-lg font-semibold text-primary">{item.time}</p>
                    </div>
                    <div className="w-3/4 pl-6 border-l-2 border-primary/30">
                      <h4 className="text-xl font-semibold mb-1 text-foreground" style={{ fontFamily: "'Times New Roman', Times, serif" }}>{item.event}</h4>
                      {item.description && <p className="text-muted-foreground">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {wedding.gallery && wedding.gallery.length > 0 && (
        <section className="py-16 md:py-20 bg-background text-foreground">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className={`${greatVibes.variable} font-serif text-4xl md:text-5xl text-center mb-12 md:mb-16 text-primary`}>
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
        <section className="py-16 md:py-20 bg-primary/5 text-foreground">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Users className="h-10 w-10 text-primary" /> {/* Using Users icon here */}
            </div>
            <h2 className={`${greatVibes.variable} font-serif text-4xl md:text-5xl text-center mb-6 text-primary`}>
              Will You Be Joining Us?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Please RSVP by {wedding.rsvpDeadline ? new Date(wedding.rsvpDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the deadline'} so we can finalize our arrangements.
            </p>
            <button className="px-10 py-4 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 transition-colors text-lg font-semibold">
              RSVP Now
            </button>
            <div className="mt-12 flex justify-center">
              <Heart className="text-primary h-8 w-8" />
            </div>
          </div>
        </section>
      </div>
    </BaseTemplate>
  );
};

export default ElegantTemplate;
    
