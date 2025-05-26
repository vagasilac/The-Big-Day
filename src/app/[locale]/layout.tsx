import type { Metadata, Viewport } from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, unstable_setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Correct relative path if globals.css is in src/app
import { Toaster } from "@/components/ui/toaster";
import { locales as i18nLocales } from '../../i18n'; // Path from src/app/[locale]/layout.tsx to src/i18n.ts

export function generateStaticParams() {
  console.log('[LocaleLayout - generateStaticParams] Generating static params for locales:', i18nLocales);
  return i18nLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  console.log(`[LocaleLayout - generateMetadata] Received locale: ${locale}`);
  if (!i18nLocales.includes(locale)) {
    console.warn(`[LocaleLayout - generateMetadata] Invalid locale "${locale}" found. Triggering notFound.`);
    notFound();
  }
  console.log(`[LocaleLayout - generateMetadata] Generating metadata for locale: ${locale}`);
  // To use translations in metadata, you'd setRequestLocale first if getTranslations is used.
  // For now, using static metadata.
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

  if (!i18nLocales.includes(locale)) {
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
    console.log(`[LocaleLayout] Attempting to call getMessages() for locale: ${locale}`);
    messages = await getMessages(); 
    console.log(`[LocaleLayout] Successfully called getMessages(). Message keys: ${messages ? Object.keys(messages).length : 'undefined/null'}`);
  } catch (error) {
    console.error(`[LocaleLayout] Failed to load messages for locale "${locale}" in LocaleLayout:`, error);
    messages = { Fallback: { message: "Error loading translations for layout."}}; 
  }
  
  if (!messages || (typeof messages === 'object' && Object.keys(messages).length === 0 && !messages.Fallback)) {
    console.warn(`[LocaleLayout] Messages are empty or undefined for locale "${locale}" before rendering NextIntlClientProvider. Providing minimal fallback.`);
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
