"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
 className,
 ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
 return (
 <TabsPrimitive.Root
 data-slot="tabs"
 className={cn("flex flex-col gap-2", className)}
 {...props}
 />
 )
}

function TabsList({
 className,
 ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
 return (
 <TabsPrimitive.List
 data-slot="tabs-list"
 className={cn( "inline-flex h-11 w-fit items-center justify-center p-1",
 className,
 )}
 {...props}
 />
 )
}

function TabsTrigger({
 className,
 ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
 return (
 <TabsPrimitive.Trigger
 data-slot="tabs-trigger"
 className={cn( "inline-flex flex-1 items-center justify-center gap-1.5 border border-transparent px-3.5 py-1.5 text-sm whitespace-nowrap transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
 className,
 )}
 {...props}
 />
 )
}

function TabsContent({
 className,
 ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
 return (
 <TabsPrimitive.Content
 data-slot="tabs-content"
 className={cn("flex-1 outline-none", className)}
 {...props}
 />
 )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
