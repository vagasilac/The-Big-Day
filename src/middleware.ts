import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Always use a locale prefix. Options: 'always' | 'as-needed' | 'never'
  // 'as-needed' will not prefix the defaultLocale
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // Skip all paths that should not be internationalized (e.g., API routes, static files).
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next/static`, `/_next/image`, or `favicon.ico`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // The root path '/' is implicitly handled if `localePrefix: 'as-needed'`
    // and `defaultLocale` are configured.
  ]
};
