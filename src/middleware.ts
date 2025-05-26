import createMiddleware from 'next-intl/middleware';
// ✅ Corrected import — must be relative from the project root to src/i18n.ts
// Since middleware.ts is in src/, and i18n.ts is in src/, the path from a root-like context is './src/i18n'.
// However, the expert's final summary used '../src/i18n' for a middleware.ts in src/ and i18n.ts in src/.
// Let's try the most direct relative path from src/middleware.ts to src/i18n.ts first if the above is problematic.
// The error "Can't resolve './i18n' in ./src/middleware.ts" confirms that Next.js attempts to resolve it relative to src/middleware.ts.
// Thus, if i18n.ts is also in src/, then './i18n' *should* be correct.
// Let's adhere to the expert's explicit code snippet which resolved to 'src/i18n.ts'.
// If middleware is at src/middleware.ts and i18n.ts is at src/i18n.ts, then '../src/i18n' makes sense if middleware's CWD is root.

// The expert's "Summary: Fix in Code" was:
// import { locales, defaultLocale } from '../src/i18n';
// This path from src/middleware.ts points to project_root/src/i18n.ts.

// If i18n.ts is in src/ and middleware.ts is in src/, and middleware is treated as root for pathing:
import { locales, defaultLocale } from './src/i18n'; // This should work.

console.log('[middleware.ts] Initializing with locales:', locales, 'Default:', defaultLocale);

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  debug: true, // Keep debug true for more logs
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - …the ones containing a dot (e.g. `favicon.ico`)
    // - …the ones starting with `/api/`
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Match the root path explicitly for default locale redirection
    '/' 
  ]
};