
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Always use a locale prefix (e.g. /en/about, /es/about)
  // or 'as-needed' to only prefix for non-default locales
  localePrefix: 'as-needed' 
});

export const config = {
  // Match only internationalized pathnames
  // Skip all paths that should not be internationalized.
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next/static`, `/_next/image`, or `favicon.ico`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // The root path '/' is implicitly