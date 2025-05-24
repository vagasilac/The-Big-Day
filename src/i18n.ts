import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
const locales = ['en', 'es'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    console.error(`Invalid locale "${locale}" passed to getRequestConfig in i18n.ts.`);
    notFound();
  }

  let messages;
  try {
    // The path is relative to `src/i18n.ts`
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale "${locale}" in i18n.ts:`, error);
    // If messages are critical, trigger a notFound response.
    notFound(); 
  }

  return {
    messages
  };
});