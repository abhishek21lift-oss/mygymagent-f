"use client"

import * as React from "react"
import { api } from "@/lib/api/client"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CheckCircle2, Loader2, ShieldCheck, UserRound, XCircle } from "lucide-react"

type PortalData={member:{id:string;firstName:string;lastName:string;email?:string|null;phone?:string|null};memberships:Array<{id:string;status:string;startDate:string;endDate:string;price:string|number;currency:string}>;attendance:Array<{id:string;checkInAt:string;checkOutAt?:string|null;method:string;deniedReason?:string|null}>}

export default function MemberPortal(){
 const [token,setToken]=React.useState(()=>typeof window!=="undefined"?new URLSearchParams(window.location.search).get("token")||"":"" )
 const [data,setData]=React.useState<PortalData|null>(null)
 const [loading,setLoading]=React.useState(false)
 const [error,setError]=React.useState("")
 const load=React.useCallback(async(t:string)=>{
   if(!t.trim()){setError("Enter your portal token.");return}
   setLoading(true);setError("")
   try{
     const result=await api.get("/portal/bootstrap/"+encodeURIComponent(t.trim())) as PortalData
     setData(result)
     if(typeof window!=="undefined") window.history.replaceState({},document.title,"/member-portal")
   }catch(e){setData(null);setError(e instanceof Error?e.message:"This portal link is invalid or expired.")}
   finally{setLoading(false)}
 },[])
 React.useEffect(()=>{if(!token)return;const timer=window.setTimeout(()=>{void load(token)},0);return()=>window.clearTimeout(timer)},[token,load])
 return <main className="min-h-svh bg-gradient-to-br from-background via-background to-muted/40 p-4 sm:p-8"><div className="mx-auto max-w-5xl space-y-6">
   <Card className="border-0 shadow-lg"><CardHeader><div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3"><ShieldCheck className="size-6"/></div><div><CardTitle>Member Portal</CardTitle><p className="text-sm text-muted-foreground">Secure single-use access to your gym account.</p></div></div></CardHeader><CardContent><div className="flex flex-col gap-3 sm:flex-row"><Input value={token} onChange={e=>setToken(e.target.value)} placeholder="Paste portal token"/><Button className="sm:w-40" onClick={()=>void load(token)} disabled={loading}>{loading?<Loader2 className="mr-2 size-4 animate-spin"/>:null}{loading?"Opening...":"Open portal"}</Button></div>{error&&<div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><XCircle className="size-4"/>{error}</div>}</CardContent></Card>
   {data&&<div className="space-y-5">
     <Card><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="rounded-full bg-primary/10 p-3"><UserRound className="size-6"/></div><div><h1 className="text-2xl font-semibold">{data.member.firstName} {data.member.lastName}</h1><p className="text-sm text-muted-foreground">{data.member.email||"No email"} · {data.member.phone||"No phone"}</p></div></div><Badge variant="secondary">{data.memberships.length} memberships</Badge></CardContent></Card>
     <div className="grid gap-5 lg:grid-cols-2">
       <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-5"/> Memberships</CardTitle></CardHeader><CardContent className="space-y-3">{data.memberships.map(m=><div key={m.id} className="rounded-xl border p-4"><div className="flex items-center justify-between"><span className="font-medium">{m.status}</span><Badge variant="outline">{m.currency} {m.price}</Badge></div><div className="mt-2 text-sm text-muted-foreground">{new Date(m.startDate).toLocaleDateString()} → {new Date(m.endDate).toLocaleDateString()}</div></div>)}{data.memberships.length===0&&<p className="text-sm text-muted-foreground">No membership records.</p>}</CardContent></Card>
       <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5"/> Recent attendance</CardTitle></CardHeader><CardContent className="space-y-3">{data.attendance.map(a=><div key={a.id} className="rounded-xl border p-4"><div className="flex items-center justify-between"><span className="font-medium">{new Date(a.checkInAt).toLocaleString()}</span><Badge variant={a.deniedReason?"destructive":"secondary"}>{a.deniedReason?"Denied":a.method}</Badge></div>{a.deniedReason&&<p className="mt-2 text-sm text-destructive">{a.deniedReason}</p>}</div>)}{data.attendance.length===0&&<p className="text-sm text-muted-foreground">No attendance records.</p>}</CardContent></Card>
     </div>
   </div>}
 </div></main>
}
