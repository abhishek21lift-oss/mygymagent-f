import type { MetadataRoute } from "next";

import { PRIVATE_PATH_PREFIXES, siteUrl } from "@/lib/site";

/** The public pages are open to crawlers; the app behind sign-in is not. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...PRIVATE_PATH_PREFIXES] }],
    sitemap: new URL("/sitemap.xml", origin).toString(),
    host: origin.host,
  };
}
