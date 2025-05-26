import {getRequestConfig, getLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// Can be imported from a shared config
export const locales = ['en', 'es'];
export const defaultLocale = 'en';

console.log('[i18n.ts] File parsed. Defined locales:', locales);

export default getRequestConfig(async () => {
  // This will be executed for every request that renders a Server Component
  const locale = await getLocale();
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

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
      console.warn(`[i18n.ts] Locale "${locale}" not explicitly handled, using English as fallback.`);
      messages = enMessages; 
    }

    if (messages) {
      console.log(`[i18n.ts] Successfully loaded/assigned messages for locale: ${locale}. Keys: ${Object.keys(messages).length}`);
    } else {
      // This case should ideally not be reached if the locale is valid and JSON files exist
      console.error(`[i18n.ts] Messages object is undefined for locale "${locale}" AFTER loading attempt.`);
      throw new Error(`Messages for locale ${locale} are undefined.`);
    }
  } catch (error) {
    console.error(`[i18n.ts] CRITICAL: Error during message loading for locale "${locale}":`, error);
    // Depending on how critical messages are, you might call notFound() or throw.
    // For now, let's return a minimal fallback to avoid crashing NextIntlClientProvider,
    // but the error log is key.
    return {
      messages: {
        Fallback: {
          message: `Error loading translations for ${locale}. Please check server logs.`
        }
      }
    };
  }
  
  return {
    messages
  };
});
