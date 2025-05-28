
import type { Metadata, Viewport } from 'next';
// import {NextIntlClientProvider} from 'next-intl'; // Temporarily Removed
// import {getMessages, unstable_setRequestLocale} from 'next-intl/server'; // Temporarily Removed
import {notFound} from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Correct relative path
import { Toaster } from "@/components/ui/toaster";
import { locales as i18nLocales } from '../../i18n'; // Path from src/app/[locale]/layout.tsx to src/i18n.ts

export function generateStaticParams() {
  return i18nLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  if (!i18nLocales.includes(locale)) {
    notFound();
  }
  return {
    title: 'The Big Day', 
    description: 'Our Wedding Website', 
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  // Basic locale validation
  if (!i18nLocales.includes(locale)) {
    notFound();
  }

  // --- Temporarily removed all next-intl logic to diagnose stack overflow ---
  // try {
  //   unstable_setRequestLocale(locale);
  // } catch (error) {
  //   console.error(`[LocaleLayout] Error calling unstable_setRequestLocale for locale "${locale}":`, error);
  //   notFound();
  // }
  
  // let messages = {}; // Default to empty messages for this diagnostic step
  // --- End of temporary removal ---

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        {/* <NextIntlClientProvider locale={locale} messages={messages}> */}
          {children}
          <Toaster />
        {/* </NextIntlClientProvider> */}
      </body>
    </html>
  );
}
