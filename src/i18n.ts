import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// List of all supported locales
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

console.log('[i18n.ts] File parsed. Defined locales:', locales);

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" provided to getRequestConfig. Triggering notFound.`);
    notFound();
  }

  let messages;
  try {
    if (locale === 'en') {
      console.log('[i18n.ts] Loading English messages (static import).');
      messages = enMessages;
    } else if (locale === 'es') {
      console.log('[i18n.ts] Loading Spanish messages (static import).');
      messages = esMessages;
    } else {
      console.warn(`[i18n.ts] Locale "${locale}" not explicitly handled in getRequestConfig, this should have been caught by validation. Defaulting to English.`);
      messages = enMessages; // Fallback, though notFound should have caught this.
    }

    if (messages && Object.keys(messages).length > 0) {
      console.log(`[i18n.ts] Successfully loaded/assigned messages for locale: ${locale}. Keys: ${Object.keys(messages).length}`);
    } else if (messages && Object.keys(messages).length === 0) {
      console.warn(`[i18n.ts] Messages object is empty for locale "${locale}" AFTER loading attempt. This might be an issue with the JSON file content.`);
      // Provide a minimal fallback to prevent NextIntlClientProvider from crashing if messages are an empty object
      messages = { MinimalFallback: { message: `Minimal fallback for ${locale} - messages were empty.` } };
    } else { // messages is undefined or null
      console.error(`[i18n.ts] Messages object is undefined or null for locale "${locale}" AFTER loading attempt.`);
      notFound();
    }
  } catch (error) {
    console.error(`[i18n.ts] CRITICAL: Error during message loading for locale "${locale}":`, error);
    notFound();
  }
  
  return {
    messages
  };
});