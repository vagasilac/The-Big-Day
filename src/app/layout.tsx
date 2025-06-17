
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'The Big Day',
  description: 'Our Wedding Website',
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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased h-full overflow-hidden`}
        suppressHydrationWarning
      >
        <div className="min-h-screen flex flex-col h-full">
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
