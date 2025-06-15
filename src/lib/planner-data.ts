export interface PlannerTask {
  id: string;
  phase: string;
  name: string;
  startDays: number; // negative = before wedding, positive = after
  durationDays: number;
  critical?: boolean;
  softCritical?: boolean;
}

export const plannerTasks: PlannerTask[] = [
  { id: 'budget', phase: 'Getting Started', name: 'Define budget and guest count', startDays: -360, durationDays: 30, critical: true },
  { id: 'theme', phase: 'Getting Started', name: 'Select wedding theme / style', startDays: -330, durationDays: 30 },
  { id: 'planner', phase: 'Getting Started', name: 'Hire wedding planner (optional)', startDays: -360, durationDays: 30 },

  { id: 'venue', phase: 'Core Bookings', name: 'Book venue', startDays: -360, durationDays: 60, critical: true },
  { id: 'photo-video', phase: 'Core Bookings', name: 'Book photographer & videographer', startDays: -330, durationDays: 60, critical: true },
  { id: 'band', phase: 'Core Bookings', name: 'Book band / DJ', startDays: -330, durationDays: 60, critical: true },
  { id: 'catering', phase: 'Core Bookings', name: 'Book catering', startDays: -330, durationDays: 90, critical: true },
  { id: 'officiant', phase: 'Core Bookings', name: 'Hire officiant', startDays: -300, durationDays: 60, critical: true },
  { id: 'florist', phase: 'Core Bookings', name: 'Book florist', startDays: -270, durationDays: 60 },

  { id: 'website', phase: 'Guest Communication', name: 'Create wedding website', startDays: -300, durationDays: 60, critical: true },
  { id: 'save-date', phase: 'Guest Communication', name: 'Send "Save the Date"', startDays: -270, durationDays: 30, critical: true },
  { id: 'guestlist', phase: 'Guest Communication', name: 'Finalize guest list', startDays: -240, durationDays: 60, critical: true },
  { id: 'invitations', phase: 'Guest Communication', name: 'Send invitations', startDays: -180, durationDays: 30, critical: true },
  { id: 'rsvps', phase: 'Guest Communication', name: 'Track RSVPs', startDays: -150, durationDays: 120, critical: true },

  { id: 'dress', phase: 'Personal Preparations', name: 'Buy wedding dress', startDays: -300, durationDays: 120, critical: true },
  { id: 'hair-makeup', phase: 'Personal Preparations', name: 'Book hair & makeup', startDays: -180, durationDays: 60 },
  { id: 'rings', phase: 'Personal Preparations', name: 'Order wedding rings', startDays: -180, durationDays: 90, critical: true },
  { id: 'transport', phase: 'Personal Preparations', name: 'Arrange transportation', startDays: -180, durationDays: 60 },
  { id: 'honeymoon', phase: 'Personal Preparations', name: 'Plan honeymoon', startDays: -180, durationDays: 90 },
  { id: 'first-dance', phase: 'Personal Preparations', name: 'Prepare first dance', startDays: -120, durationDays: 105, softCritical: true },
  { id: 'rehearsal-dance', phase: 'Personal Preparations', name: 'Final dance rehearsal', startDays: -7, durationDays: 3, softCritical: true },

  { id: 'menu', phase: 'Final Steps', name: 'Finalize menu and cake', startDays: -120, durationDays: 60, critical: true },
  { id: 'dress-fitting', phase: 'Final Steps', name: 'Final dress fitting', startDays: -60, durationDays: 30, critical: true },
  { id: 'confirm-vendors', phase: 'Final Steps', name: 'Confirm vendors', startDays: -60, durationDays: 30, critical: true },
  { id: 'guest-headcount', phase: 'Final Steps', name: 'Final guest headcount', startDays: -30, durationDays: 14, critical: true },
  { id: 'seating-chart', phase: 'Final Steps', name: 'Seating chart & place cards', startDays: -14, durationDays: 7, critical: true },
  { id: 'wedding-rehearsal', phase: 'Final Steps', name: 'Wedding rehearsal', startDays: -2, durationDays: 1, critical: true },

  { id: 'wedding-day', phase: 'Wedding Day', name: 'Wedding Day', startDays: 0, durationDays: 1, critical: true },

  { id: 'upload-photos', phase: 'Post-Wedding', name: 'Upload photos & videos', startDays: 7, durationDays: 7 },
  { id: 'thank-you', phase: 'Post-Wedding', name: 'Thank-you notes / website post', startDays: 7, durationDays: 7 },
  { id: 'honeymoon-gallery', phase: 'Post-Wedding', name: 'Honeymoon gallery', startDays: 14, durationDays: 7 },
  { id: 'guest-export', phase: 'Post-Wedding', name: 'Final guest export/report (optional)', startDays: 14, durationDays: 7 },
];
