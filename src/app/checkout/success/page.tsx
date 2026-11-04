'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessBody() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'missing'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('missing');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json() as { paymentStatus?: string };
        if (cancelled) return;
        if (data.paymentStatus === 'paid' || data.paymentStatus === 'no_payment_required') setStatus('paid');
        else setStatus('pending');
      } catch {
        if (!cancelled) setStatus('pending');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center bg-background">
      <Heart className="h-10 w-10 text-primary mb-4" />
      <h1 className="text-3xl mb-3">
        {status === 'paid' ? 'Payment received' : status === 'missing' ? 'Checkout' : 'Payment is processing'}
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        {status === 'paid'
          ? 'Stripe confirmed this payment. Your plan is recorded when the webhook finishes, which is the step that unlocks it on every phone you sign in with.'
          : status === 'missing'
            ? 'This page opens after Stripe Checkout. No session was included in the link.'
            : 'If you paid with a method that confirms later, the plan is recorded when Stripe sends checkout.session.async_payment_succeeded. This page does not grant the plan by itself.'}
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to the dashboard</Link>
      </Button>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-background" />}>
      <SuccessBody />
    </Suspense>
  );
}
