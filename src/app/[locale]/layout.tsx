import type { Metadata, Viewport } from 'next';
import {NextIntlClientProvider} from 'next-intl';
// Remove getMessages, import messages directly for diagnostics
import {unstable_setRequestLocale} from 'next-intl/server'; 
import {notFound} from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Relative path
import { Toaster } from "@/components/ui/toaster";

// Statically import messages for this diagnostic step
import enMessages from '../../messages/en.json';
import esMessages from '../../messages/es.json';

// Locales must be defined here or imported if i18n.ts is still used for them
const locales = ['en', 'es']; 
export const defaultLocale = 'en';

export function generateStaticParams() {
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

  if (!locales.includes(locale as any)) {
    console.warn(`[LocaleLayout] Invalid locale "${locale}" received in props. Triggering notFound.`);
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
    console.log(`[LocaleLayout] Manually selecting messages for locale: ${locale}`);
    if (locale === 'en') {
      messages = enMessages;
    } else if (locale === 'es') {
      messages = esMessages;
    } else {
      // Fallback, though validation above should catch this
      console.warn(`[LocaleLayout] No direct messages found for locale "${locale}", defaulting to English.`);
      messages = enMessages;
    }
    console.log(`[LocaleLayout] Successfully assigned messages. Message keys: ${messages ? Object.keys(messages).length : 'undefined/null'}`);
  } catch (error) {
    console.error(`[LocaleLayout] Failed to assign messages for locale "${locale}" in LocaleLayout:`, error);
    messages = { Fallback: { message: "Error loading/assigning translations for layout."}}; 
    // notFound(); // Potentially trigger notFound if critical
  }
  
  if (!messages || (typeof messages === 'object' && Object.keys(messages).length === 0 && !messages.Fallback)) {
    console.warn(`[LocaleLayout] Messages are empty or undefined for locale "${locale}" before rendering NextIntlClientProvider.`);
    messages = { Fallback: { message: "Translations unavailable for layout."}};
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
