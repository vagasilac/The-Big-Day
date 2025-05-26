import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n'; // Import from src/i18n.ts

console.log('[middleware.ts] Initializing with locales:', locales, 'Default:', defaultLocale);

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // Skip all paths that should not be internationalized (e.g., API routes, static files).
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // The root path '/' is implicitly handled by localePrefix: 'as-needed'
  ]
};
