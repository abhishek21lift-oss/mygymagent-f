import type { MetadataRoute } from "next";

import { LEGAL_LINKS } from "@/lib/legal";
import { ARTICLES, FEATURE_PAGES } from "@/lib/marketing";
import { siteUrl } from "@/lib/site";

/**
 * When the public pages last changed in substance. Google reads
 * `lastModified` (it ignores priority and change frequency), so bump this
 * when the landing, pricing or feature copy changes.
 */
const SITE_UPDATED = "2026-10-08";

/** Every public page: the landing page, pricing, features, articles,
 * sign-up and the policies. Sign-in has no search value and is left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const at = (path: string) => new URL(path, origin).toString();
  return [
    { url: at("/"), lastModified: SITE_UPDATED, priority: 1 },
    { url: at("/pricing"), lastModified: SITE_UPDATED, priority: 0.9 },
    { url: at("/features"), lastModified: SITE_UPDATED, priority: 0.8 },
    ...FEATURE_PAGES.map((page) => ({ url: at(`/features/${page.slug}`), lastModified: SITE_UPDATED, priority: 0.8 })),
    { url: at("/resources"), lastModified: SITE_UPDATED, priority: 0.6 },
    ...ARTICLES.map((a) => ({ url: at(`/resources/${a.slug}`), lastModified: a.updated ?? a.published, priority: 0.6 })),
    { url: at("/register"), lastModified: SITE_UPDATED, priority: 0.7 },
    ...LEGAL_LINKS.map((link) => ({ url: at(link.href), lastModified: SITE_UPDATED, priority: 0.2 })),
  ];
}
