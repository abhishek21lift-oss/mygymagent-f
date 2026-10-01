import type { MetadataRoute } from "next";

import { PRIVATE_PATH_PREFIXES, siteUrl } from "@/lib/site";

/** The public pages are open to crawlers; the app behind sign-in is not. */
export default function robots(): MetadataRoute.Robots {
  const origin = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATH_PREFIXES] }],
    sitemap: new URL("/sitemap.xml", origin).toString(),
    host: origin.host,
  };
}
