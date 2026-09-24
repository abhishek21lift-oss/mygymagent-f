"use client"

import * as React from "react"
import { api } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHero } from "@/components/shared/page-hero"
import { DataState } from "@/components/shared/data-state"
import { toast } from "sonner"
import { Brain, Gift, Headphones, Megaphone, ReceiptIndianRupee, RefreshCw, ShieldCheck, Sparkles, Star, Tablet, Users } from "lucide-react"

type Campaign = { id:string; name:string; channel:string; status:string; audienceFilter?:Record<string,unknown>; scheduledAt?:string|null }
type Ticket = { id:string; subject:string; status:string; priority:string; createdAt:string }
type Survey = { id:string; name:string; kind:string; active:boolean }
type Account = { id:string; code:string; name:string; type:string; active:boolean }

export default function BusinessOsPage(){
 const {hasPermission}=useAuth()
 const [memberId,setMemberId]=React.useState("")
 const [points,setPoints]=React.useState("100")
 const [reason,setReason]=React.useState("Manual loyalty adjustment")
 const [ticket,setTicket]=React.useState({subject:"",description:"",priority:"NORMAL"})
 const [campaign,setCampaign]=React.useState({name:"",channel:"EMAIL",templateKey:"",audienceFilter:"{}"})
 const [survey,setSurvey]=React.useState({name:"Member satisfaction",kind:"CSAT"})
 const [account,setAccount]=React.useState({code:"4000",name:"Membership Revenue",type:"REVENUE"})
 const [aiCommand,setAiCommand]=React.useState("")
 const [campaigns,setCampaigns]=React.useState<Campaign[]>([])
 const [tickets,setTickets]=React.useState<Ticket[]>([])
 const [surveys,setSurveys]=React.useState<Survey[]>([])
 const [accounts,setAccounts]=React.useState<Account[]>([])
 const [output,setOutput]=React.useState<unknown>(null)
 // Starts true: before B-P0-3 the first paint showed four zeroes while
 // the fetch was still in flight, which reads as "you have none of
 // anything" rather than "not loaded yet".
 const [loading,setLoading]=React.useState(true)
 // And a *failed* fetch left those same four zeroes on screen, saying
 // the same untrue thing after the toast had gone.
 const [loadError,setLoadError]=React.useState(false)

 const refresh=React.useCallback(async()=>{
 setLoading(true)
 try{
 const [cs,ts,ss,as]=await Promise.all([
 hasPermission("marketing.read")?api.get("/marketing/campaigns"):Promise.resolve([]),
 hasPermission("support.read")?api.get("/support/tickets"):Promise.resolve([]),
 hasPermission("feedback.read")?api.get("/feedback/surveys"):Promise.resolve([]),
 hasPermission("accounting.read")?api.get("/accounting/accounts"):Promise.resolve([]),
 ])
 setCampaigns(Array.isArray(cs)?cs as Campaign[]:[])
 setTickets(Array.isArray(ts)?ts as Ticket[]:[])
 setSurveys(Array.isArray(ss)?ss as Survey[]:[])
 setAccounts(Array.isArray(as)?as as Account[]:[])
 setLoadError(false)
 }catch(e){setLoadError(true);toast.error(e instanceof Error?e.message:"Could not refresh Business OS")}
 finally{setLoading(false)}
 },[hasPermission])

 React.useEffect(()=>{const timer=window.setTimeout(()=>{void refresh()},0);return()=>window.clearTimeout(timer)},[refresh])

 const run=async(fn:()=>Promise<unknown>,message?:string)=>{
 try{const r=await fn();setOutput(r);if(message)toast.success(message);await refresh()}catch(e){toast.error(e instanceof Error?e.message:"Request failed")}
 }

 const createCampaign=async()=>{
 try{
 const audienceFilter=JSON.parse(campaign.audienceFilter||"{}")
 await run(()=>api.post("/marketing/campaigns",{name:campaign.name,channel:campaign.channel,templateKey:campaign.templateKey,audienceFilter}),"Campaign created")
 setCampaign({...campaign,name:""})
 }catch(e){toast.error(e instanceof Error?e.message:"Audience filter must be valid JSON")}
 }

 return <div className="space-y-6">
 <PageHero id="business-os" icon={Sparkles} title="Business OS" description="Operational controls for loyalty, support, feedback, marketing, accounting and AI."/>
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="min-w-0 flex-1">
 <DataState
 isLoading={loading}
 isError={loadError}
 onRetry={()=>void refresh()}
 errorMessage="Business OS counts could not be loaded."
 emptyTitle="Business OS"
 skeletonRows={1}
 >
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
 <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Campaigns</div><div className="text-2xl font-semibold">{campaigns.length}</div></CardContent></Card>
 <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Open tickets</div><div className="text-2xl font-semibold">{tickets.filter(t=>!["RESOLVED","CLOSED"].includes(t.status)).length}</div></CardContent></Card>
 <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Surveys</div><div className="text-2xl font-semibold">{surveys.length}</div></CardContent></Card>
 <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Accounts</div><div className="text-2xl font-semibold">{accounts.length}</div></CardContent></Card>
 </div>
 </DataState>
 </div>
 <Button variant="outline" onClick={()=>void refresh()} disabled={loading}><RefreshCw className={`mr-2 size-4 ${loading?"animate-spin":""}`}/>Refresh</Button>
 </div>

 <div className="grid gap-5 xl:grid-cols-3">
 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><Gift className="size-5"/> Loyalty & Referral</CardTitle></CardHeader><CardContent className="space-y-3">
 <Label>Member ID</Label><Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member UUID"/>
 <div className="grid grid-cols-2 gap-2"><Input value={points} onChange={e=>setPoints(e.target.value)} type="number"/><Input value={reason} onChange={e=>setReason(e.target.value)}/></div>
 <div className="flex flex-wrap gap-2">{hasPermission("loyalty.manage")&&<Button disabled={!memberId} onClick={()=>void run(()=>api.post("/loyalty/"+memberId+"/adjust",{points:Number(points),reason}),"Points updated")}>Adjust points</Button>}{hasPermission("referrals.manage")&&<Button disabled={!memberId} variant="outline" onClick={()=>void run(()=>api.post("/referrals/"+memberId),"Referral code created")}>Create referral</Button>}</div>
 </CardContent></Card>

 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><Headphones className="size-5"/> Support & Feedback</CardTitle></CardHeader><CardContent className="space-y-3">
 <Input value={ticket.subject} onChange={e=>setTicket({...ticket,subject:e.target.value})} placeholder="Ticket subject"/>
 <Input value={ticket.description} onChange={e=>setTicket({...ticket,description:e.target.value})} placeholder="Description"/>
 <select className="h-10 w-full rounded-xl border bg-background px-3" value={ticket.priority} onChange={e=>setTicket({...ticket,priority:e.target.value})}><option>NORMAL</option><option>LOW</option><option>HIGH</option><option>URGENT</option></select>
 {hasPermission("support.manage")&&<Button disabled={!ticket.subject||!ticket.description} onClick={()=>void run(()=>api.post("/support/tickets",ticket),"Ticket created")}>Create ticket</Button>}
 {hasPermission("feedback.manage")&&<div className="border-t pt-3"><Input value={survey.name} onChange={e=>setSurvey({...survey,name:e.target.value})} placeholder="Survey name"/><Button className="mt-2" variant="outline" onClick={()=>void run(()=>api.post("/feedback/surveys",survey),"Survey created")}>Create survey</Button></div>}
 </CardContent></Card>

 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><Megaphone className="size-5"/> Marketing Automation</CardTitle></CardHeader><CardContent className="space-y-3">
 <Input value={campaign.name} onChange={e=>setCampaign({...campaign,name:e.target.value})} placeholder="Campaign name"/>
 <select className="h-10 w-full rounded-xl border bg-background px-3" value={campaign.channel} onChange={e=>setCampaign({...campaign,channel:e.target.value})}><option>EMAIL</option><option>WHATSAPP</option><option>SMS</option></select>
 <Input value={campaign.templateKey} onChange={e=>setCampaign({...campaign,templateKey:e.target.value})} placeholder="Message/template"/>
 <textarea className="min-h-24 w-full rounded-xl border bg-background p-3 text-sm" value={campaign.audienceFilter} onChange={e=>setCampaign({...campaign,audienceFilter:e.target.value})} placeholder={'Audience JSON, e.g. {"hasActiveMembership":true,"hasEmail":true}'}/>
 {hasPermission("marketing.manage")&&<Button disabled={!campaign.name} onClick={()=>void createCampaign()}>Create campaign</Button>}
 {hasPermission("marketing.manage")&&campaigns.length>0&&<div className="space-y-2 border-t pt-3"><div className="text-xs font-medium text-muted-foreground">Recent campaigns</div>{campaigns.slice(0,5).map(c=><div key={c.id} className="flex items-center justify-between rounded-lg border p-2 text-sm"><span className="truncate">{c.name}</span><div className="flex gap-1"><span className="rounded-full bg-muted px-2 py-1 text-xs">{c.status}</span><Button size="sm" variant="outline" onClick={()=>void run(()=>api.post("/marketing/campaigns/"+c.id+"/enroll"),"Audience enrolled")}>Enroll</Button><Button size="sm" onClick={()=>void run(()=>api.post("/marketing/campaigns/"+c.id+"/run"),"Batch processed")}>Run</Button></div></div>)}</div>}
 </CardContent></Card>

 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><ReceiptIndianRupee className="size-5"/> Accounting</CardTitle></CardHeader><CardContent className="space-y-3">
 <div className="grid grid-cols-2 gap-2"><Input value={account.code} onChange={e=>setAccount({...account,code:e.target.value})}/><Input value={account.name} onChange={e=>setAccount({...account,name:e.target.value})}/></div>
 <select className="h-10 w-full rounded-xl border bg-background px-3" value={account.type} onChange={e=>setAccount({...account,type:e.target.value})}><option>ASSET</option><option>LIABILITY</option><option>EQUITY</option><option>REVENUE</option><option>EXPENSE</option></select>
 {hasPermission("accounting.manage")&&<Button onClick={()=>void run(()=>api.post("/accounting/accounts",account),"Account created")}>Create account</Button>}
 <div className="flex flex-wrap gap-2">{hasPermission("accounting.read")&&<><Button variant="outline" onClick={()=>void run(()=>api.get("/accounting/trial-balance"),"Trial balance loaded")}>Trial balance</Button><Button variant="outline" onClick={()=>void run(()=>api.get("/accounting/tax-summary"),"Tax summary loaded")}>Tax summary</Button></>}</div>
 </CardContent></Card>

 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><Brain className="size-5"/> PT Intelligence</CardTitle></CardHeader><CardContent className="space-y-3">
 <Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member UUID"/>
 <Button disabled={!memberId} onClick={()=>void run(()=>api.get("/pt-intelligence/"+memberId),"PT intelligence loaded")}>Analyze member</Button>
 </CardContent></Card>

 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><Sparkles className="size-5"/> Global AI Command</CardTitle></CardHeader><CardContent className="space-y-3">
 <Input value={aiCommand} onChange={e=>setAiCommand(e.target.value)} placeholder="Ask about revenue, risk, inventory..."/>
 <Button disabled={!aiCommand.trim()} onClick={()=>void run(()=>api.post("/global-ai/command",{command:aiCommand}),"AI command completed")}><Sparkles className="mr-2 size-4"/>Run command</Button>
 </CardContent></Card>
 </div>

 <div className="grid gap-5 lg:grid-cols-2">
 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><Users className="size-5"/> Recent support tickets</CardTitle></CardHeader><CardContent><div className="space-y-2">{tickets.slice(0,8).map(t=><div key={t.id} className="flex items-center justify-between rounded-lg border p-3"><div><div className="font-medium">{t.subject}</div><div className="text-xs text-muted-foreground">{t.priority} · {new Date(t.createdAt).toLocaleString()}</div></div><span className="rounded-full bg-muted px-2 py-1 text-xs">{t.status}</span></div>)}{tickets.length===0&&<div className="text-sm text-muted-foreground">No tickets found.</div>}</div></CardContent></Card>
 <Card><CardHeader><CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2"><ShieldCheck className="size-5"/> Member Portal & Kiosk</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Portal links are single-use and can be revoked. Kiosk devices are branch-bound.</p><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={()=>window.open("/member-portal","_blank")}><Star className="mr-2 size-4"/>Member Portal</Button><Button variant="outline" onClick={()=>window.open("/kiosk","_blank")}><Tablet className="mr-2 size-4"/>Kiosk</Button></div></CardContent></Card>
 </div>

 {output!==null&&<Card><CardHeader><CardTitle>Latest result</CardTitle></CardHeader><CardContent><pre className="max-h-[420px] overflow-auto rounded-xl bg-muted p-4 text-xs">{JSON.stringify(output,null,2)}</pre></CardContent></Card>}
 </div>
}
