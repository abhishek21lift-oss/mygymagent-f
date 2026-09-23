"use client"

import type { ReactNode } from "react"
import { PageHero } from "@/components/shared/page-hero"
import { Package } from "lucide-react"
import { InventoryNav } from "./inventory-nav"

export function InventoryResourceShell({title,description,children,actions}:{title:string;description?:string;children:ReactNode;actions?:ReactNode}) {
 return <div className="mx-auto flex max-w-[1680px] flex-col gap-6 px-2 pb-12 sm:px-4 lg:px-6">
 <PageHero icon={Package} title={title} variant="light" accent="amber" actions={actions} />
 <InventoryNav />
 {description && <p className="text-sm font-medium text-stone-500">{description}</p>}
 {children}
 </div>
}
