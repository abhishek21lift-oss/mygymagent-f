"use client"

import type { ReactNode } from "react"
import { PageHero } from "@/components/shared/page-hero"
import { Package } from "lucide-react"
import { InventoryNav } from "./inventory-nav"

/**
 * One masthead for all twelve inventory screens.
 *
 * Title + actions only — per-page subtitles were decorative noise.
 * `description` is accepted for compatibility but not rendered.
 *
 * No `accent` -- inventory belongs to Operations, and the route map
 * gives the whole section one hue. The `amber` this used to pass was
 * Finance's.
 */
export function InventoryResourceShell({title,description,children,actions}:{title:string;description?:string;children:ReactNode;actions?:ReactNode}) {
 void description;
 return <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-2 pb-12 sm:px-4 lg:px-6">
 <PageHero icon={Package} title={title} actions={actions} />
 <InventoryNav />
 {children}
 </div>
}
