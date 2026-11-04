'use client';

import { isLocalMode } from '@/lib/data-mode';

export function LocalModeNote() {
  if (!isLocalMode()) return null;
  return (
    <div className="bg-amber-50 text-amber-950 text-xs sm:text-sm text-center px-3 py-2 border-b border-amber-200">
      Phone preview: accounts and wedding details stay in this browser. Nothing is sent to Firebase.
    </div>
  );
}
