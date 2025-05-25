import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// Can be imported from a shared config
const locales = ['en', 'es'];

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" provided in getRequestConfig. Triggering notFound.`);
    notFound();
  }

  let messages;
  if (locale === 'en') {
    console.log('[i18n.ts] Loading English messages.');
    messages = enMessages;
  } else if (locale === 'es') {
    console.log('[i18n.ts] Loading Spanish messages.');
    messages = esMessages;
  } else {
    // Fallback for safety, though validated above
    console.warn(`[i18n.ts] No specific messages for locale "${locale}", defaulting to 'en'. This shouldn't happen if validation is correct.`);
    messages = enMessages;
  }
  
  if (!messages || Object.keys(messages).length === 0) {
    console.error(`[i18n.ts] Critical: Messages object is undefined or empty for locale: ${locale} before returning. This might indicate an issue with JSON file loading or parsing.`);
    // Returning an empty object or a minimal default to prevent crashes, but this signals a problem.
    return {
      messages: { Fallback: { message: "Error loading translations." } }
    };
  }

  console.log(`[i18n.ts] Successfully loaded messages for locale: ${locale}. Message keys count: ${Object.keys(messages).length}`);
  return {
    messages
  };
});