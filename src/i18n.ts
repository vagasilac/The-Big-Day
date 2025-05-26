// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Statically define supported locales and default locale
// These are also imported by middleware.ts
export const locales = ['en', 'es'] as const;
export const defaultLocale: typeof locales[number] = 'en';

console.log('[i18n.ts] File parsed. Supported locales:', locales, 'Default locale:', defaultLocale);

// Static imports for messages (more robust for some environments)
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" received. Triggering notFound.`);
    notFound();
  }

  let messages;
  if (locale === 'en') {
    console.log('[i18n.ts] Using statically imported English messages.');
    messages = enMessages;
  } else if (locale === 'es') {
    console.log('[i18n.ts] Using statically imported Spanish messages.');
    messages = esMessages;
  } else {
    // This case should ideally not be reached due to the validation above
    console.warn(`[i18n.ts] Locale "${locale}" not explicitly handled for static import, falling back to English.`);
    messages = enMessages;
  }

  if (!messages || Object.keys(messages).length === 0) {
    console.error(`[i18n.ts] Messages object is undefined or empty for locale "${locale}" AFTER static loading attempt.`);
    // If messages are critical, trigger a 404 or throw an error.
    // For now, we'll provide a minimal fallback to prevent NextIntlClientProvider from crashing,
    // but this indicates a serious issue.
    return {
      messages: {MinimalFallback: {message: "Critical error: Default messages not available for " + locale + "."}}
    };
  }
  
  console.log(`[i18n.ts] Successfully loaded messages for locale: ${locale}. Number of root keys: ${Object.keys(messages).length}`);

  return {
    messages
  };
});
