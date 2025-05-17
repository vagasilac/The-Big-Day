
'use client';

import React from 'react';
import type { Wedding } from '@/types/wedding';
import BaseTemplate from './base-template';
import { nunitoSans, caveat } from '../../../lib/fonts'; // Relative path
import { Calendar, MapPin, Heart, Users, Gift, Leaf, Clock, Camera } from 'lucide-react'; // Added Camera
import Image from 'next/image';

interface RusticTemplateProps {
  wedding: Partial<Wedding>;
}

const RusticTemplate: React.FC<RusticTemplateProps> = ({ wedding }) => {
  return (
    <BaseTemplate wedding={wedding}>
      <div className={`${nunitoSans.variable} font-sans bg-[#fdfaf6] text-[#5d4037]`}>
        {/* Details Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12 md:mb-16">
              <h2 className={`${caveat.variable} font-script text-4xl md:text-5xl mb-2 text-[#6d4c41]`}>
                The Big Day
              </h2>
              <div className="flex items-center justify-center">
                <div className="h-px bg-[#a1887f]/50 w-16"></div>
                <Leaf className="mx-3 h-5 w-5 text-[#8d6e63]" />
                <div className="h-px bg-[#a1887f]/50 w-16"></div>
              </div>
            </div>
            
            <div className="bg-white/80 border border-[#d7ccc8] p-6 md:p-10 rounded-lg shadow-md backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="text-center md:border-r md:border-[#d7ccc8] md:pr-5">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#efebe9] mb-6">
                    <Calendar className="h-7 w-7 text-[#795548]" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-[#5d4037]" style={{ fontFamily: "'Times New Roman', Times, serif" }}>When</h3>
                  <p className="text-lg text-[#6d4c41] mb-1">
                    {wedding.date
                      ? new Date(wedding.date).toLocaleDateString('en-US', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : 'Date to be announced'}
                  </p>
                  <p className="text-lg text-[#6d4c41]">
                    {wedding.date
                      ? new Date(wedding.date).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        })
                      : 'Time to be announced'}
                  </p>
                </div>
                
                <div className="text-center md:pl-5">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#efebe9] mb-6">
                    <MapPin className="h-7 w-7 text-[#795548]" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-[#5d4037]" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Where</h3>
                  <p className="text-lg text-[#6d4c41] mb-1">
                    {wedding.location || 'Venue to be announced'}
                  </p>
                  <p className="text-md text-[#6d4c41]">
                    123 Country Lane, Meadowville, MV 98765
                  </p>
                </div>
              </div>
              {wedding.dressCode && (
                <div className="mt-10 text-center pt-8 border-t border-[#d7ccc8]">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#efebe9] mb-6">
                        <Users className="h-7 w-7 text-[#795548]" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-[#5d4037]" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Attire</h3>
                    <p className="text-lg text-[#6d4c41]">{wedding.dressCode}</p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Schedule Section */}
        {wedding.schedule && wedding.schedule.length > 0 && (
          <section className="py-16 md:py-20 bg-white/70 backdrop-blur-sm border-y border-[#d7ccc8]">
            <div className="container mx-auto px-6 max-w-3xl">
              <div className="text-center mb-12 md:mb-16">
                <h2 className={`${caveat.variable} font-script text-4xl md:text-5xl mb-2 text-[#6d4c41]`}>
                  Our Wedding Timeline
                </h2>
                 <div className="flex items-center justify-center">
                    <div className="h-px bg-[#a1887f]/50 w-16"></div>
                    <Clock className="mx-3 h-5 w-5 text-[#8d6e63]" />
                    <div className="h-px bg-[#a1887f]/50 w-16"></div>
                </div>
              </div>
              <div className="space-y-10">
                {wedding.schedule.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-28 text-right pr-6 text-[#795548] font-medium text-lg">
                      {item.time}
                    </div>
                    <div className="relative flex-grow pl-8 border-l-2 border-[#bcaaa4]">
                       <div className="absolute -left-[9px] top-1 w-4 h-4 bg-[#8d6e63] rounded-full border-2 border-[#fdfaf6]"></div>
                      <h3 className="text-xl font-semibold mb-1 text-[#5d4037]">{item.event}</h3>
                      {item.description && <p className="text-[#6d4c41]">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {wedding.gallery && wedding.gallery.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12 md:mb-16">
                <h2 className={`${caveat.variable} font-script text-4xl md:text-5xl mb-2 text-[#6d4c41]`}>
                    Sweet Memories
                </h2>
                 <div className="flex items-center justify-center">
                    <div className="h-px bg-[#a1887f]/50 w-16"></div>
                    <Camera className="mx-3 h-5 w-5 text-[#8d6e63]" />
                    <div className="h-px bg-[#a1887f]/50 w-16"></div>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {wedding.gallery.map((photo) => (
                <div key={photo.id} className="aspect-1 rounded-md overflow-hidden shadow-md border-2 border-white/80 transform transition-all hover:scale-105 hover:shadow-xl">
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Wedding moment'}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                    data-ai-hint="rustic wedding couple"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        )}
        
        {/* RSVP Section */}
        <section className="py-16 md:py-20 bg-[#efebe9]/70 border-t border-[#d7ccc8]">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/80 shadow-sm border border-[#d7ccc8] mb-6">
              <Users className="h-10 w-10 text-[#795548]" />
            </div>
            <h2 className={`${caveat.variable} font-script text-4xl md:text-5xl mb-6 text-[#6d4c41]`}>
              Will You Be There?
            </h2>
            <p className="text-lg text-[#5d4037] mb-8 max-w-xl mx-auto">
              We&apos;d be overjoyed to share our special day with you. Please let us know if you can make it by {wedding.rsvpDeadline ? new Date(wedding.rsvpDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'}) : 'the deadline'}.
            </p>
            <button className="px-10 py-3 bg-[#795548] text-white rounded-md shadow-lg hover:bg-[#6d4c41] transition-colors text-lg font-semibold">
              RSVP
            </button>
          </div>
        </section>
      </div>
    </BaseTemplate>
  );
};

export default RusticTemplate;
