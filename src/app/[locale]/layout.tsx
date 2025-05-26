import type { Metadata, Viewport } from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Relative path
import { Toaster } from "@/components/ui/toaster";
import { locales as i18nLocales } from '@/i18n'; // Import from alias for tsconfig check

// Statically import messages for this diagnostic step
// This was a previous diagnostic step, reverting to getMessages()
// import enMessages from '../../messages/en.json'; 
// import esMessages from '../../messages/es.json';

// Locales must be defined here or imported if i18n.ts is still used for them
const locales = ['en', 'es']; 
export const defaultLocale = 'en';

export function generateStaticParams() {
  console.log('[LocaleLayout - generateStaticParams] Generating params for locales:', locales);
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  console.log(`[LocaleLayout - generateMetadata] Received locale: ${locale}`);
  if (!locales.includes(locale as any)) {
    console.warn(`[LocaleLayout - generateMetadata] Invalid locale "${locale}" found. Triggering notFound.`);
    notFound();
  }
  // Note: If using getTranslations for metadata, unstable_setRequestLocale would be needed here too.
  // For now, keeping metadata static.
  console.log(`[LocaleLayout - generateMetadata] Generating metadata for locale: ${locale}`);
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
  console.log(`[LocaleLayout] Rendering for locale: ${locale}`);

  if (!i18nLocales.includes(locale as any)) { // Use imported locales for validation
    console.warn(`[LocaleLayout] Invalid locale "${locale}" received in props (checked against i18n.ts). Triggering notFound.`);
    notFound();
  }

  try {
    console.log(`[LocaleLayout] Calling unstable_setRequestLocale with: ${locale}`);
    unstable_setRequestLocale(locale);
    console.log(`[LocaleLayout] unstable_setRequestLocale finished for: ${locale}`);
  } catch (error) {
    console.error(`[LocaleLayout] Error calling unstable_setRequestLocale for locale "${locale}":`, error);
    notFound(); 
  }
  
  let messages;
  try {
    console.log(`[LocaleLayout] Attempting to call getMessages() for locale: ${locale}`);
    // getMessages() will now use the locale set by unstable_setRequestLocale.
    messages = await getMessages(); 
    console.log(`[LocaleLayout] Successfully called getMessages(). Message keys: ${messages ? Object.keys(messages).length : 'undefined/null'}`);
  } catch (error) {
    console.error(`[LocaleLayout] Failed to load messages for locale "${locale}" in LocaleLayout:`, error);
    // Provide a minimal fallback to prevent NextIntlClientProvider from crashing
    messages = { Fallback: { message: `Error loading translations for layout. Locale: ${locale}`}}; 
    // Depending on severity, you might still want to call notFound() here
    // notFound(); 
  }
  
  if (!messages || (typeof messages === 'object' && Object.keys(messages).length === 0 && !messages.Fallback)) {
    console.warn(`[LocaleLayout] Messages are empty or undefined for locale "${locale}" before rendering NextIntlClientProvider (after try-catch).`);
    messages = { Fallback: { message: `Translations unavailable for locale ${locale} in layout.`}};
  }


  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
