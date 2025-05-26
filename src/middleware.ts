import createMiddleware from 'next-intl/middleware';
// i18n.ts should be in src/, so this relative path is correct from src/middleware.ts
import { locales, defaultLocale } from './i18n'; 

console.log('[middleware.ts] Initializing with locales:', locales, 'Default:', defaultLocale);

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', 
  debug: true // Enable debug mode for more logs
});

export const config = {
  // Match all pathnames except for
  // - …containing `api/` or `_next/` (from next-intl example)
  // - …the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
