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
type PlatformInvoice = { id:string; amountMinor:number; currency:string; status:string; periodStart:string; periodEnd:string; paidAt:string|null };

function money(minor:number, currency:string){
 return `${currency==="INR"?"₹":`${currency} `}${(minor/100).toLocaleString()}`;
}

/**
 * What the gym has actually been billed.
 *
 * The page showed the plan and the usage against it and nothing about
 * money already owed or paid -- so "am I up to date?" had no answer here.
 * Its own query rather than part of the bundle above: an organization on
 * its first month has no invoices, and that must not read as the plan
 * grid failing to load.
 */
function InvoiceHistory(){
 const q=useQuery({
  queryKey:["platform-billing","invoices"],
  queryFn:()=>api.get<PlatformInvoice[]>("/platform-billing/invoices"),
 });
 return <section className="rounded-xl border bg-card p-6 shadow-sm">
  <h2 className="text-xl font-black">Invoices</h2>
  <div className="mt-4">
   <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load your invoices." isEmpty={(q.data??[]).length===0} emptyTitle="No invoices yet" emptyDescription="Invoices appear here at the end of each billing period." skeletonRows={3}>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="py-2 pr-4">Period</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2">Paid</th></tr></thead><tbody>
     {(q.data??[]).map(inv=><tr key={inv.id} className="border-b last:border-0">
      <td className="py-2 pr-4 tabular-nums">{new Date(inv.periodStart).toLocaleDateString()} – {new Date(inv.periodEnd).toLocaleDateString()}</td>
      <td className="py-2 pr-4 text-right font-bold tabular-nums">{money(inv.amountMinor, inv.currency)}</td>
      <td className="py-2 pr-4"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${inv.status==="PAID"?"bg-emerald-500/10 text-emerald-800":"bg-amber-500/10 text-amber-900"}`}>{inv.status}</span></td>
      <td className="py-2 tabular-nums text-muted-foreground">{inv.paidAt?new Date(inv.paidAt).toLocaleDateString():"—"}</td>
     </tr>)}
    </tbody></table></div>
   </DataState>
  </div>
 </section>;
}

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
    <section className="rounded-xl border bg-card p-6 shadow-sm"><h2 className="text-xl font-black">Current usage</h2><div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3">{[["Members",usage?.usage.members,usage?.plan?.maxMembers],["Branches",usage?.usage.branches,usage?.plan?.maxBranches],["Staff",usage?.usage.staff,usage?.plan?.maxStaff]].map(([label,value,max])=><div key={String(label)} className="rounded-lg border p-4"><p className="text-sm text-stone-500">{label}</p><p className="mt-1 text-2xl font-black">{value ?? "—"} <span className="text-sm font-medium text-stone-400">/ {max ?? "∞"}</span></p></div>)}</div></section>
    <InvoiceHistory />
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{plans.map(p=><div key={p.id} className={`rounded-xl border bg-card p-6 shadow-sm ${usage?.plan?.planKey===p.key?"ring-2 ring-indigo-500":""}`}><h2 className="text-xl font-black">{p.name}</h2><p className="mt-2 text-3xl font-black">{p.priceMinor===0?"Free":`₹${(p.priceMinor/100).toLocaleString()}`}<span className="text-sm font-medium text-stone-500">/mo</span></p><ul className="my-5 space-y-2 text-sm text-stone-600"><li>Up to {p.maxMembers??"unlimited"} members</li><li>{p.maxBranches??"Unlimited"} branches</li><li>{p.maxStaff??"Unlimited"} staff</li><li>{p.aiMonthlyRequests??"Unlimited"} AI requests/month</li></ul><Button className="w-full rounded-lg" disabled={busy!==null||usage?.plan?.planKey===p.key} aria-busy={busy===p.key} onClick={()=>choose(p.key)}>{usage?.plan?.planKey===p.key?<><CheckCircle2 className="mr-2 size-4"/>Current plan</>:busy===p.key?"Updating…":"Choose plan"}</Button></div>)}</section>
   </div>
  </DataState>
 </main>;
}
