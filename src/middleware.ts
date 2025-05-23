
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // The locale prefix strategy
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // This pattern covers the root and all locale-prefixed paths.
  // It excludes API routes, _next/static, _next/image, and files with extensions (like favicon.ico).
  matcher: [
    '/', // Match the root for default locale redirection
    '/(en|es)/:path*', // Match locale-prefixed paths
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)' // A more general matcher to catch other paths that might need i18n, while excluding common static assets. Adjust if too broad.
  ]
};
