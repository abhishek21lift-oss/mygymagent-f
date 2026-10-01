import type { MetadataRoute } from "next";

import { LEGAL_LINKS } from "@/lib/legal";
import { siteUrl } from "@/lib/site";

/** Every public page: the landing page, sign-up and the policies. */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const at = (path: string) => new URL(path, origin).toString();
  return [
    { url: at("/"), changeFrequency: "weekly", priority: 1 },
    { url: at("/register"), changeFrequency: "monthly", priority: 0.8 },
    { url: at("/login"), changeFrequency: "yearly", priority: 0.3 },
    ...LEGAL_LINKS.map((link) => ({ url: at(link.href), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
