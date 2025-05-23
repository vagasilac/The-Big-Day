
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
const locales = ['en', 'es'];

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    // Using a more explicit path construction, assuming messages are in src/messages
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale "${locale}":`, error);
    // Fallback or re-throw if critical, for now, it might lead to a partial page or error
    // depending on how getMessages handles this upstream.
    // For robustness, you might want to ensure a default set of messages is always available.
    notFound(); // Or provide default/fallback messages
  }

  return {
    messages
  };
});
