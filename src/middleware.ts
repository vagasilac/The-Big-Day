import createMiddleware from 'next-intl/middleware';
// Assuming i18n.ts is in src/, and middleware.ts is in src/
// The path must be relative from project root to the file if Next.js resolves middleware from root context.
// If Next.js resolves middleware from its own location (src/), then './i18n' is correct.
// The expert advice indicated middleware is often treated as root for resolution.
// However, a previous successful fix used './i18n' when both were in src/.
// Let's stick to './i18n' first, as it's simpler if it works.
import { locales, defaultLocale } from './i18n';

console.log('[middleware.ts] Initializing with locales:', locales, 'Default:', defaultLocale);

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Redirects root to defaultLocale, e.g. / -> /en
  debug: true // Enable verbose logging from next-intl
});

export const config = {
  // Match only internationalized pathnames
  // Skip all paths that should not be internationalized. This example skips the
  // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Match all pathnames within `/en` or `/es` (e.g. /en/about)
    // This is an example, adjust to your locales if they change from ['en', 'es']
    '/([\\w-]+)?/api/(.+)', // Exclude API routes under locales as well
    '/(en|es)/