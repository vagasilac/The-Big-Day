// This is the root layout that wraps everything, including the [locale] segments.
// It should be minimal. The actual content layout is in src/app/[locale]/layout.tsx.

import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'The Big Day', // This can be overridden by [locale]/layout.tsx
  description: 'Our Wedding Website', // This can be overridden
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The lang attribute will be set in the [locale]/layout.tsx
    <html lang="en" suppressHydrationWarning> 
      <head />
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}