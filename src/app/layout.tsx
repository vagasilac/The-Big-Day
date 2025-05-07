import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Import GeistSans from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono';   // Import GeistMono from 'geist/font/mono'
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

export const metadata: Metadata = {
  title: 'The Big Day', // Updated App Name
  description: 'Our Wedding Website', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply Geist font variables directly to the html or body tag */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
