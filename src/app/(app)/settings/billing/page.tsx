"use client";

import * as React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { DataState } from "@/components/shared/data-state";
import { useQuery } from "@tanstack/react-query";

type Plan = { id:string; key:string; name:string; priceMinor:number; currency:string; maxMembers:number|null; maxBranches:number|null; maxStaff:number|null; aiMonthlyRequests:number|null; };
type Usage = { plan: (Plan & { status:string; planKey:string }) | null; usage:{members:number;branches:number;staff:number} };

export default function PlatformBillingPage() {
 // React Query rather than a hand-rolled effect, as everywhere else in
 // this app: it supplies the pending and error flags this page had no
 // way to show before. Previously a failed load produced only a toast,
 // which had faded by the time anyone read the screen, leaving a usage
 // panel of em dashes above an empty plan grid -- which reads as "no
 // plans exist" rather than "the request failed".
 const q=useQuery({
  queryKey:["platform-billing"],
  queryFn:async()=>{
   const [plans,usage]=await Promise.all([api.get<Plan[]>("/platform-billing/plans"),api.get<Usage>("/platform-billing/usage")]);
   return {plans,usage};
  },
 });
 const plans=q.data?.plans??[];
 const usage=q.data?.usage??null;
 const [busy,setBusy]=React.useState<string|null>(null);
 async function choose(planKey:string){setBusy(planKey);try{await api.post("/platform-billing/subscription",{planKey});toast.success("Plan updated");window.location.reload()}catch(e){toast.error(e instanceof Error?e.message:"Plan update failed")}finally{setBusy(null)}}
 return <main className="space-y-8"><PageHero title="Platform billing" icon={CreditCard} />
  <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load your plan and usage." isEmpty={plans.length===0} emptyTitle="No plans available" emptyDescription="No subscription plans are configured for this platform yet." skeletonRows={4}>
   <div className="space-y-8">
    <section className="rounded-xl border bg-card p-6 shadow-sm"><h2 className="text-xl font-black">Current usage</h2><div className="mt-4 grid gap-4 sm:grid-cols-3">{[["Members",usage?.usage.members,usage?.plan?.maxMembers],["Branches",usage?.usage.branches,usage?.plan?.maxBranches],["Staff",usage?.usage.staff,usage?.plan?.maxStaff]].map(([label,value,max])=><div key={String(label)} className="rounded-lg border p-4"><p className="text-sm text-stone-500">{label}</p><p className="mt-1 text-2xl font-black">{value ?? "—"} <span className="text-sm font-medium text-stone-400">/ {max ?? "∞"}</span></p></div>)}</div></section>
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{plans.map(p=><div key={p.id} className={`rounded-xl border bg-card p-6 shadow-sm ${usage?.plan?.planKey===p.key?"ring-2 ring-indigo-500":""}`}><h2 className="text-xl font-black">{p.name}</h2><p className="mt-2 text-3xl font-black">{p.priceMinor===0?"Free":`₹${(p.priceMinor/100).toLocaleString()}`}<span className="text-sm font-medium text-stone-500">/mo</span></p><ul className="my-5 space-y-2 text-sm text-stone-600"><li>Up to {p.maxMembers??"unlimited"} members</li><li>{p.maxBranches??"Unlimited"} branches</li><li>{p.maxStaff??"Unlimited"} staff</li><li>{p.aiMonthlyRequests??"Unlimited"} AI requests/month</li></ul><Button className="w-full rounded-lg" disabled={busy!==null||usage?.plan?.planKey===p.key} aria-busy={busy===p.key} onClick={()=>choose(p.key)}>{usage?.plan?.planKey===p.key?<><CheckCircle2 className="mr-2 size-4"/>Current plan</>:busy===p.key?"Updating…":"Choose plan"}</Button></div>)}</section>
   </div>
  </DataState>
 </main>;
}
