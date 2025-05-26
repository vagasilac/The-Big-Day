import createMiddleware from 'next-intl/middleware';
// If i18n.ts is in src/ and middleware.ts is in src/, this relative path is correct.
import { locales, defaultLocale } from './i18n'; 

console.log('[middleware.ts] Initializing with locales:', locales, 'Default:', defaultLocale);

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', 
  debug: true 
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ]
};
