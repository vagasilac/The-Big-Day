
'use client';

import React from 'react';
import type { Wedding } from '@/types/wedding';
import BaseTemplate from './base-template'; // Relative path
import { Calendar, MapPin, Heart, Camera, Music, Users, Gift, ListChecks } from 'lucide-react';
import Image from 'next/image';

interface ModernTemplateProps {
  wedding: Partial<Wedding>;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ wedding }) => {
  return (
    <BaseTemplate wedding={wedding}>
      <div className="font-sans"> {/* Using Geist Sans from layout.tsx by default */}
        {/* Details Section */}
        <section className="py-16 md:py-20 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center text-foreground">
              <span className="pb-2 border-b-4 border-primary">Event Essentials</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-md mr-4">
                    <Calendar className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">Date & Time</h3>
                </div>
                <p className="text-muted-foreground mb-1">
                  {wedding.date
                    ? new Date(wedding.date).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })
                    : 'Date TBA'}
                </p>
                <p className="text-muted-foreground">
                  {wedding.date
                    ? new Date(wedding.date).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })
                    : 'Time TBA'}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-md mr-4">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">Location</h3>
                </div>
                <p className="text-muted-foreground mb-1">
                  {wedding.location || 'Venue TBA'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Detailed address will be provided upon RSVP.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 bg-primary text-primary-foreground p-3 rounded-md mr-4">
                    <Users className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">Dress Code</h3>
                </div>
                <p className="text-muted-foreground">
                  {wedding.dressCode || 'Comfortably Chic'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        {wedding.schedule && wedding.schedule.length > 0 && (
          <section className="py-16 md:py-20 bg-background text-foreground">
            <div className="container mx-auto px-6 max-w-4xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center">
                 <span className="pb-2 border-b-4 border-primary">The Day&apos;s Plan</span>
              </h2>
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-border rounded-full"></div>
                {wedding.schedule.map((item, index) => (
                  <div key={index} className="mb-10 pl-10 relative">
                    <div className="absolute left-[-20px] top-1.5 w-10 h-10 bg-primary rounded-full border-4 border-background flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-primary font-semibold text-md mb-1">{item.time}</p>
                    <h4 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">{item.event}</h4>
                    {item.description && <p className="text-muted-foreground">{item.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {wedding.gallery && wedding.gallery.length > 0 && (
          <section className="py-16 md:py-20 bg-secondary text-secondary-foreground">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center text-foreground">
                <span className="pb-2 border-b-4 border-primary">Captured Moments</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                {wedding.gallery.map((photo) => (
                  <div key={photo.id} className="aspect-[3/4] rounded-lg overflow-hidden shadow-lg group transition-all duration-300 hover:shadow-2xl">
                    <Image
                      src={photo.url}
                      alt={photo.description || 'Wedding photo'}
                      width={400}
                      height={533} // for 3:4 aspect ratio
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      data-ai-hint="wedding gallery couple"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RSVP Section */}
        <section className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 max-w-3xl text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 mb-6">
                 <ListChecks className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Celebration</h2>
            <p className="text-lg md:text-xl opacity-90 mb-10 max-w-xl mx-auto">
              We&apos;re excited to celebrate with you. Please let us know if you can make it by {wedding.rsvpDeadline ? new Date(wedding.rsvpDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'the deadline'}!
            </p>
            <button className="px-10 py-3 bg-primary-foreground text-primary font-bold rounded-md shadow-lg hover:bg-background hover:text-foreground transition-colors text-lg">
              RSVP NOW
            </button>
          </div>
        </section>
      </div>
    </BaseTemplate>
  );
};

export default ModernTemplate;
