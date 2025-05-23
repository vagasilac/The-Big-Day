
// This is the root layout.
// Internationalization will be handled by the [locale] segment.
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Metadata here can be generic or overridden by [locale]/layout.tsx
export const metadata: Metadata = {
  title: 'The Big Day',
  description: 'Our Wedding Website',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The lang attribute will be set dynamically in [locale]/layout.tsx by next-intl
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {/* Toaster can remain here as it's a global utility */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
