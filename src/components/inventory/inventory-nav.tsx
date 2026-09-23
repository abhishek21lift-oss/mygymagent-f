"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Boxes, ClipboardList, FileText, GitBranch, History, LayoutDashboard, PackageSearch, QrCode, RotateCcw, ShoppingCart, Truck, Users } from "lucide-react"

const items = [
 ["/inventory","Overview",LayoutDashboard],
 ["/inventory/branch-stock","Branch Stock",Boxes],
 ["/inventory/reorder","Reorder",PackageSearch],
 ["/inventory/suppliers","Suppliers",Users],
 ["/inventory/purchase-orders","Purchase Orders",ClipboardList],
 ["/inventory/transfers","Transfers",GitBranch],
 ["/inventory/sales","Sales",ShoppingCart],
 ["/inventory/returns","Returns",RotateCcw],
 ["/inventory/valuation","Valuation",BarChart3],
 ["/inventory/reports","Reports",FileText],
 ["/inventory/scanner","Scanner",QrCode],
 ["/inventory/movements","Movements",History],
] as const

export function InventoryNav() {
 const pathname = usePathname()
 return <nav aria-label="Inventory navigation" className="flex gap-2 overflow-x-auto pb-1">
 {items.map(([href,label,Icon]) => {
 const active = href === "/inventory" ? pathname === href : pathname.startsWith(href)
 return <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${active ? "border-amber-300 bg-amber-50 text-amber-900 shadow-sm" : "border-stone-200 bg-card text-stone-600 hover:border-amber-200 hover:bg-amber-50/60"}`}>
 <Icon className="size-3.5" />{label}
 </Link>
 })}
 </nav>
}
