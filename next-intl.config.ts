
// next-intl.config.ts
// This file is used to provide a basic configuration for next-intl,
// especially helpful for tools or environments that might expect it.
// The primary configuration for message loading is still in src/i18n.ts.

/** @type {import('next-intl').NextIntlConfig} */
const config = {
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
};

export default config;
