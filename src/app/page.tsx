
// This root page.tsx is mostly a pass-through or not rendered
// if middleware.ts correctly rewrites to /[locale]
// The actual homepage content is now in src/app/[locale]/page.tsx.

export default function RootPage() {
  // This component might not even render if middleware always redirects.
  // If it does, it could be an empty shell or a simple loading indicator.
  // For simplicity with next-intl's middleware approach, this often just returns null
  // as the [locale] segment takes over.
  return null;
}
