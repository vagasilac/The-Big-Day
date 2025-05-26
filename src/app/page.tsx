// This file is now minimal and mostly defers to the [locale] specific page.
// It can be used for non-localized root-level pages if needed in the future.

import { redirect } from 'next/navigation';
import { defaultLocale } from './../i18n'; // Adjust path if i18n.ts is elsewhere

export default function RootPage() {
  // Redirect to the default locale's homepage
  // This ensures that users landing on "/" are correctly routed to "/en" or your default.
  redirect(`/${defaultLocale}`);

  // Or, if you want to render some content at the root before redirection,
  // you can return JSX here. However, for i18n, direct redirection is common.
  // return (
  //   <div>
  //     <h1>Loading...</h1>
  //   </div>
  // );
}
