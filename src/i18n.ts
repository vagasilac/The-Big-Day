import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

// Can be imported from a shared config
const locales = ['en', 'es'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" provided. Triggering notFound.`);
    notFound();
  }

  let messages;
  if (locale === 'en') {
    messages = enMessages;
  } else if (locale === 'es') {
    messages = esMessages;
  } else {
    // Fallback for safety, though validated above
    console.warn(`[i18n.ts] No specific messages for locale "${locale}", defaulting to 'en'. This shouldn't happen.`);
    messages = enMessages;
  }
  
  if (!messages) {
    // This case should ideally not be reached if the logic above is sound and message files exist.
    console.error(`[i18n.ts] Critical: Messages object is undefined for locale: ${locale} before returning.`);
    notFound(); 
  }

  return {
    messages
  };
});