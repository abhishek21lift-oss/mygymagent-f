"use client";

import * as React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";

type Plan = { id:string; key:string; name:string; priceMinor:number; currency:string; maxMembers:number|null; maxBranches:number|null; maxStaff:number|null; aiMonthlyRequests:number|null; };
type Usage = { plan: Plan & { status:string } | null; usage:{members:number;branches:number;staff:number} };

export default function PlatformBillingPage() {
 const [plans,setPlans]=React.useState<Plan[]>([]);
 const [usage,setUsage]=React.useState<Usage|null>(null);
 const [busy,setBusy]=React.useState<string|null>(null);
 const load=React.useCallback(async()=>{const [p,u]=await Promise.all([api.get<Plan[]>("/platform-billing/plans"),api.get<Usage>("/platform-billing/usage")]);setPlans(p);setUsage(u)},[]);
 React.useEffect(()=>{void load().catch(e=>toast.error(e instanceof Error?e.message:"Billing could not be loaded"))},[load]);
 async function choose(planKey:string){setBusy(planKey);try{await api.post("/platform-billing/subscription",{planKey});toast.success("Plan updated");await load()}catch(e){toast.error(e instanceof Error?e.message:"Plan update failed")}finally{setBusy(null)}}
 return <main className="space-y-8"><PageHero title="Platform Billing" icon={CreditCard} /><section className="rounded-3xl border bg-white/80 p-6 shadow-sm"><h2 className="text-xl font-black">Current usage</h2><div className="mt-4 grid gap-4 sm:grid-cols-3">{[["Members",usage?.usage.members,usage?.plan?.maxMembers],["Branches",usage?.usage.branches,usage?.plan?.maxBranches],["Staff",usage?.usage.staff,usage?.plan?.maxStaff]].map(([label,value,max])=><div key={String(label)} className="rounded-2xl border p-4"><p className="text-sm text-stone-500">{label}</p><p className="mt-1 text-2xl font-black">{value ?? "—"} <span className="text-sm font-medium text-stone-400">/ {max ?? "∞"}</span></p></div>)}</div></section><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{plans.map(p=><div key={p.id} className={`rounded-3xl border bg-white/80 p-6 shadow-sm ${usage?.plan?.planKey===p.key?"ring-2 ring-indigo-500":""}`}><h2 className="text-xl font-black">{p.name}</h2><p className="mt-2 text-3xl font-black">{p.priceMinor===0?"Free":`₹${(p.priceMinor/100).toLocaleString()}`}<span className="text-sm font-medium text-stone-500">/mo</span></p><ul className="my-5 space-y-2 text-sm text-stone-600"><li>Up to {p.maxMembers??"unlimited"} members</li><li>{p.maxBranches??"Unlimited"} branches</li><li>{p.maxStaff??"Unlimited"} staff</li><li>{p.aiMonthlyRequests??"Unlimited"} AI requests/month</li></ul><Button className="w-full rounded-2xl" disabled={busy!==null||usage?.plan?.planKey===p.key} onClick={()=>choose(p.key)}>{usage?.plan?.planKey===p.key?<><CheckCircle2 className="mr-2 size-4"/>Current plan</>:busy===p.key?"Updating…":"Choose plan"}</Button></div>)}</section></main>;
}
