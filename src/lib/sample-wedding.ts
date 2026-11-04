import type { Wedding } from '@/types/wedding';
import { SAMPLE_SLUG } from '@/lib/wedding-options';

/**
 * Placeholder content already used by the marketing page template preview.
 * It is not a real couple, date, or venue.
 */
export const sampleWeddingData: Partial<Wedding> = {
  id: 'sample',
  userId: 'sample',
  title: "Anna & Paul's Wedding",
  slug: SAMPLE_SLUG,
  description:
    'We are so excited to celebrate our special day with all of our amazing friends and family! Join us for a day filled with love, laughter, and unforgettable memories as we begin our new journey together.',
  date: '2026-06-15T17:30:00.000Z',
  location: 'The Enchanted Garden, Springsville',
  address: '',
  coverPhoto:
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwYmFucXVldCUyMHJvb218ZW58MHx8fHwxNzQ3NTg4OTg5fDA&ixlib=rb-4.0.3&q=80&w=1080',
  templateId: 'classic-elegance',
  gallery: [
    { id: '1', url: 'https://images.unsplash.com/photo-1522346513757-54c352451edb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwcm9wb3NhbCUyMGJlYWNofGVufDB8fHx8MTc0NzY5NTQ0MHww&ixlib=rb-4.0.3&q=80&w=400', description: 'The Proposal', dataAiHint: 'proposal beach sunset' },
    { id: '2', url: 'https://images.unsplash.com/photo-1591604466107-ec97de527c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwcm9wb3NhbCUyMGJlYWNofGVufDB8fHx8MTc0NzY5NTQ0MHww&ixlib=rb-4.0.3&q=80&w=400', description: 'She said yes!', dataAiHint: 'engagement ring hand' },
    { id: '3', url: 'https://images.unsplash.com/photo-1508808937599-06c4f5855260?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwdmVudWUlMjBnYXJkZW58ZW58MHx8fHwxNzQ3Njk1NTA1fDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Our Future Venue', dataAiHint: 'wedding venue garden' },
    { id: '4', url: 'https://images.unsplash.com/photo-1589156218404-209c028574b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx3ZWRkaW5nJTIwdmVudWUlMjBnYXJkZW58ZW58MHx8fHwxNzQ3Njk1NTA1fDA&ixlib=rb-4.0.3&q=80&w=400', description: 'Venue Details', dataAiHint: 'outdoor wedding setup' },
    { id: '5', url: 'https://images.unsplash.com/photo-1552873829-78940e407a4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxlbmdhZ2VtZW50JTIwcGhvdG9zJTIwY291cGxlfGVufDB8fHx8MTc0NzY5NTU1NHww&ixlib=rb-4.0.3&q=80&w=400', description: 'Engagement Photos', dataAiHint: 'engagement photos couple' },
    { id: '6', url: 'https://images.unsplash.com/photo-1580403390485-499ea959307f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxlbmdhZ2VtZW50JTIwcGhvdG9zJTIwY291cGxlfGVufDB8fHx8MTc0NzY5NTU1NHww&ixlib=rb-4.0.3&q=80&w=400', description: 'Save the Date', dataAiHint: 'couple holding hands' },
  ],
  schedule: [
    { time: '3:00 PM', event: 'Guest Arrival', description: 'Welcome drinks and light refreshments' },
    { time: '4:00 PM', event: 'Ceremony', description: 'Join us as we say "I do"' },
    { time: '5:00 PM', event: 'Cocktail Hour', description: 'Enjoy cocktails and appetizers' },
    { time: '6:30 PM', event: 'Reception', description: 'Dinner, dancing, and celebrations' },
    { time: '10:00 PM', event: 'Sparkler Send-off', description: 'Wish us well as we depart' },
  ],
  dressCode: 'Semi-Formal: Suits, gowns, or cocktail dresses.',
  rsvpDeadline: '2026-04-30T23:59:00.000Z',
  registry: [],
  songs: [],
};

export function getSampleWedding(): Partial<Wedding> {
  return sampleWeddingData;
}
