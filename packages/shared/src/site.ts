// The canonical public origin of the app.
//
// Both apps build shared links from this, so a link can never point at a
// different host: the sitemap, the canonical tag, social cards, the share
// button, the chat assistant's answers and the weekly recap email all resolve
// to the same place.
//
// The value here is the real site, never a placeholder. A wrong default
// ships bad links to every shared page, sitemap entry and email - silently,
// because nothing fails. The frontend and backend can each override it with
// NEXT_PUBLIC_SITE_URL / SITE_URL for staging deployments.
export const SITE_URL = "https://www.tradexcel.site";

/**
 * Absolute URL for a path on the site.
 * siteUrl("/u/ada") -> "https://www.tradexcel.site/u/ada"
 */
export function siteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
