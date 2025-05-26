import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';

export const locales = ['en', 'es'];
export const defaultLocale = 'en';

console.log('[i18n.ts] File parsed. Defined locales:', locales);

export default getRequestConfig(async ({locale}) => {
  console.log(`[i18n.ts] getRequestConfig called with locale: ${locale}`);

  if (!locales.includes(locale as any)) {
    console.warn(`[i18n.ts] Invalid locale "${locale}" provided to getRequestConfig. Triggering notFound.`);
    notFound();
  }

  let messages;
  if (locale === 'en') {
    console.log('[i18n.ts] Loading English messages (static import).');
    messages = enMessages;
  } else if (locale === 'es') {
    console.log('[i18n.ts] Loading Spanish messages (static import).');
    messages = esMessages;
  } else {
    console.warn(`[i18n.ts] Locale "${locale}" not explicitly handled, defaulting to English.`);
    messages = enMessages; 
  }

  if (messages && typeof messages === 'object' && Object.keys(messages).length > 0) {
    console.log(`[i18n.ts] Successfully loaded/assigned messages for locale: ${locale}. Keys: ${Object.keys(messages).length}`);
  } else {
    console.error(`[i18n.ts] Messages object is empty or undefined for locale "${locale}" AFTER loading attempt.`);
    notFound();
  }
  
  return {
    messages
  };
});
