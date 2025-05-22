import type { Metadata } from 'next';
import {NextIntlClientProvider, useMessages} from 'next-intl';
// import {getMessages} from 'next-intl/server'; // Using useMessages for client components too
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Adjusted path for globals.css
import { Toaster } from "@/components/ui/toaster";
import {unstable_setRequestLocale} from 'next-intl/server';


// Can be dynamic based on locale if needed
// export const metadata: Metadata = {
//   title: 'The Big Day',
//   description: 'Our Wedding Website',
// };

export function generateStaticParams() {
  return [{locale: 'en'}, {locale: 'es'}];
}

export default function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  unstable_setRequestLocale(locale);
  // Providing all messages to the client
  // side is a good default.
  const messages = useMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Metadata can be set here or in individual page.tsx files */}
        <title>The Big Day</title>
        <meta name="description" content="Our Wedding Website" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
