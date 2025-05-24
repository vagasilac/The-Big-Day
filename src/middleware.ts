
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
  // Skip all paths that should not be internationalized. This example skips the
  // folders "api", "_next" and all files with an extension (e.g. favicon.ico)
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Match all pathnames within `/` (e.g. `/`, `/about`)
    // This ensures the root path is also handled by the middleware for default locale redirection
    '/', 
    // Match all pathnames within `/en` or `/es` (e.g. `/en/about`, `/es/contact`)
    '/(en|es)/:path*'
  ]
};
