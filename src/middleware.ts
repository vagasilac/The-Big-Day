
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Recommended for SEO and clarity
});

export default function middleware(req: NextRequest) {
  // Skip i18n for API routes, static files, etc.
  if (
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.includes('.') // Generally for static files
  ) {
    return; // Do not apply intl middleware to these paths
  }
  return intlMiddleware(req);
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/` and specific static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
