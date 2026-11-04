'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase-config';

export function CheckoutButton({ planId, popular }: { planId: string; popular?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const buy = async () => {
    setBusy(true);
    setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const user = auth.currentUser as { getIdToken?: () => Promise<string> } | null;
      if (user && typeof user.getIdToken === 'function') {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan: planId }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Checkout is not available.');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setBusy(false);
    }
  };

  return (
    <div className="mt-auto">
      <Button type="button" variant={popular ? 'default' : 'outline'} size="lg" className="w-full" disabled={busy} onClick={buy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Buy this plan
      </Button>
      {error && <p className="text-center text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
