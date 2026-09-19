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
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-[12px] border border-[#4a3f2a] bg-gradient-to-b from-[#8f8163] to-[#4a3f2a] p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_1px_0_rgba(255,245,220,0.45)]",
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
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-transparent px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-[#8a6420] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-[#5c4f38] data-[state=active]:bg-gradient-to-b data-[state=active]:from-[#fff8e2] data-[state=active]:via-[#e8d9ae] data-[state=active]:to-[#c9b586] data-[state=active]:text-[#2e2313] data-[state=active]:shadow-[inset_0_1px_0_#fff,0_2px_4px_rgba(0,0,0,0.4)] data-[state=inactive]:text-[#e9dcb8] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
