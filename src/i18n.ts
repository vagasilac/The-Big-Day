import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// Can be imported from a shared config
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
      console.log('[i18n.ts] Assigning English messages (statically imported).');
      messages = enMessages;
    } else if (locale === 'es') {
      console.log('[i18n.ts] Assigning Spanish messages (statically imported).');
      messages = esMessages;
    } else {
      // Fallback for safety, though validation should catch this.
      console.warn(`[i18n.ts] Locale "${locale}" not explicitly handled, defaulting to English.`);
      messages = enMessages;
    }

    if (messages && typeof messages === 'object' && Object.keys(messages).length > 0) {
      console.log(`[i18n.ts] Successfully assigned messages for locale: ${locale}. Number of top-level keys: ${Object.keys(messages).length}`);
    } else {
      console.error(`[i18n.ts] Messages object is empty or undefined for locale "${locale}" AFTER assignment attempt.`);
      // Potentially trigger notFound() here if empty messages are not acceptable
      // For now, we'll let it proceed and see if NextIntlClientProvider handles empty messages.
    }
  } catch (error) {
    console.error(`[i18n.ts] CRITICAL: Error during message assignment for locale "${locale}":`, error);
    // This catch might not be hit if the static imports themselves fail,
    // as that would be a module resolution error at build time.
    // This is more for if the JSON files were somehow malformed post-import.
    notFound();
  }
  
  return {
    messages
  };
});