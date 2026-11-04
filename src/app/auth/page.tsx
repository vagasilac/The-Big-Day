import { Suspense } from 'react';
import AuthPageClient from './auth-page-client';

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-secondary" />}>
      <AuthPageClient />
    </Suspense>
  );
}
