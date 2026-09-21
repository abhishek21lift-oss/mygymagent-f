"use client"

import * as React from "react"
import { api } from "@/lib/api/client"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, MonitorSmartphone, XCircle } from "lucide-react"

type Result={allowed:boolean;reason?:string;member?:{firstName:string;lastName:string}}

export default function Kiosk(){
 const [deviceKey,setDeviceKey]=React.useState("")
 const [memberId,setMemberId]=React.useState("")
 const [result,setResult]=React.useState<Result|null>(null)
 const [loading,setLoading]=React.useState(false)
 React.useEffect(()=>{const saved=localStorage.getItem("mygymagent:kiosk-device-key");if(saved)setDeviceKey(saved)},[])
 async function checkIn(){
   if(!deviceKey.trim()||!memberId.trim()) return
   setLoading(true);setResult(null)
   try{
     localStorage.setItem("mygymagent:kiosk-device-key",deviceKey.trim())
     setResult(await api.post("/kiosk/check-in",{deviceKey:deviceKey.trim(),memberId:memberId.trim()}) as Result)
     setMemberId("")
   }catch(e){setResult({allowed:false,reason:e instanceof Error?e.message:"Check-in failed"})}
   finally{setLoading(false)}
 }
 return <main className="min-h-svh bg-gradient-to-br from-background via-background to-muted/40 p-4 sm:p-8"><div className="mx-auto max-w-xl">
   <Card className="overflow-hidden border-0 shadow-xl"><CardHeader className="border-b bg-muted/30"><div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3"><MonitorSmartphone className="size-6"/></div><div><CardTitle>Gym Self-Service Kiosk</CardTitle><p className="text-sm text-muted-foreground">Branch-bound secure check-in.</p></div></div></CardHeader><CardContent className="space-y-4 p-6"><Input value={deviceKey} onChange={e=>setDeviceKey(e.target.value)} placeholder="Kiosk device key" type="password"/><Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member ID" onKeyDown={e=>{if(e.key==="Enter")void checkIn()}}/><Button className="h-14 w-full text-base" disabled={loading||!deviceKey.trim()||!memberId.trim()} onClick={()=>void checkIn()}>{loading?<Loader2 className="mr-2 size-5 animate-spin"/>:null}{loading?"Checking...":"Check in member"}</Button>{result&&<div className={`rounded-2xl border p-5 ${result.allowed?"border-emerald-500/30 bg-emerald-500/5":"border-destructive/30 bg-destructive/5"}`}>{result.allowed?<CheckCircle2 className="mb-2 size-8 text-emerald-600"/>:<XCircle className="mb-2 size-8 text-destructive"/>}<div className="text-lg font-semibold">{result.allowed?"Check-in allowed":"Check-in denied"}</div><p className="mt-1 text-sm text-muted-foreground">{result.allowed&&result.member?`${result.member.firstName} ${result.member.lastName}`:result.reason}</p></div>}</CardContent></Card>
 </div></main>
}
