import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// Add a log at the very top to see if this file is even being parsed
console.log('[i18n.ts] File parsed by Node/Next.js');

// List of all locales that are supported
const locales = ['en', 'es'];

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" provided. Triggering notFound.`);
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
      // Fallback, though should be caught by validation above
      console.warn(`[i18n.ts] Locale "${locale}" not explicitly handled, defaulting to English.`);
      messages = enMessages;
    }
    console.log(`[i18n.ts] Successfully loaded messages for locale: ${locale}. Keys: ${Object.keys(messages || {}).length}`);
  } catch (error) {
    console.error(`[i18n.ts] CRITICAL: Error importing messages for locale "${locale}":`, error);
    // If message loading fails, trigger notFound or return a minimal fallback
    // to prevent NextIntlClientProvider from crashing.
    // Forcing a notFound() might be better to make the error obvious.
    notFound();
    // As a last resort, to prevent a complete crash of NextIntlClientProvider if notFound() doesn't stop execution:
    // return {
    //   messages: { Fallback: { message: "Error loading translations." } }
    // };
  }
  
  if (!messages || Object.keys(messages).length === 0) {
    // This case should ideally be caught by the try-catch or earlier validation
    console.error(`[i18n.ts] Messages object is undefined or empty for locale "${locale}" AFTER loading attempt.`);
    notFound();
  }

  return {
    messages
  };
});
