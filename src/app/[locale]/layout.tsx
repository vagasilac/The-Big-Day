import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css'; // Adjusted path relative to [locale]
import { Toaster } from "@/components/ui/toaster";
import { locales as i18nLocales } from '../../i18n'; // Use relative path to root i18n.ts

// Can be imported from a shared config
// const locales = ['en', 'es']; - Now imported from i18n.ts

export function generateStaticParams() {
  console.log('[LocaleLayout - generateStaticParams] Generating static params for locales:', i18nLocales);
  return i18nLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  console.log(`[LocaleLayout - generateMetadata] Received locale: ${locale}`);
  if (!i18nLocales.includes(locale)) {
    console.warn(`[LocaleLayout - generateMetadata] Invalid locale "${locale}" found. Using default metadata or triggering notFound if necessary.`);
    // notFound(); // Consider if you want to 404 for metadata of invalid locales
  }
  // It's good practice to set a request locale for metadata generation if it uses translations
  // unstable_setRequestLocale(locale); // If getTranslations is used below
  console.log(`[LocaleLayout - generateMetadata] Generating metadata for locale: ${locale}`);
  
  // Example of fetching translated metadata (optional, requires messages setup)
  // const messages = await getMessages({locale});
  // const t = createTranslator({locale, messages, namespace: 'Metadata'});
  // return {
  //   title: t('title'),
  //   description: t('description')
  // };

  return {
    title: 'The Big Day', // Default/fallback title
    description: 'Our Wedding Website', // Default/fallback description
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
    console.warn(`[LocaleLayout] Invalid locale "${locale}" in props. Triggering notFound.`);
    notFound();
  }

  try {
    console.log(`[LocaleLayout] Calling unstable_setRequestLocale with: ${locale}`);
    unstable_setRequestLocale(locale);
    console.log(`[LocaleLayout] unstable_setRequestLocale finished for: ${locale}`);
  } catch (error) {
    console.error(`[LocaleLayout] Error calling unstable_setRequestLocale for locale "${locale}":`, error);
    notFound(); // If setting locale fails, we can't proceed
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
    // if messages are absolutely critical, you might prefer to call notFound() here.
    messages = { Fallback: { message: "Error loading translations for layout."}}; 
  }
  
  // Additional check for empty messages, though try-catch should handle load failures
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