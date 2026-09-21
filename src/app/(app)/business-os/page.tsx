"use client"

import * as React from "react"
import { api } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHero } from "@/components/shared/page-hero"
import { toast } from "sonner"
import { Brain, Gift, Headphones, Megaphone, ReceiptIndianRupee, ShieldCheck, Sparkles, Star, Tablet } from "lucide-react"

export default function BusinessOsPage(){
  const {hasPermission}=useAuth()
  const [memberId,setMemberId]=React.useState("")
  const [points,setPoints]=React.useState("100")
  const [reason,setReason]=React.useState("Manual loyalty adjustment")
  const [ticket,setTicket]=React.useState({subject:"",description:"",priority:"NORMAL"})
  const [campaign,setCampaign]=React.useState({name:"",channel:"EMAIL",templateKey:""})
  const [survey,setSurvey]=React.useState({name:"Member satisfaction",kind:"CSAT"})
  const [account,setAccount]=React.useState({code:"4000",name:"Membership Revenue",type:"REVENUE"})
  const [aiCommand,setAiCommand]=React.useState("")
  const [output,setOutput]=React.useState<unknown>(null)
  const run=async(fn:()=>Promise<unknown>,message?:string)=>{try{const r=await fn();setOutput(r);if(message)toast.success(message)}catch(e){toast.error(e instanceof Error?e.message:"Request failed")}}
  return <div className="space-y-6">
    <PageHero id="business-os" icon={Sparkles} title="Business OS" description="Loyalty, support, feedback, marketing, accounting, member portal, kiosk and AI command control." variant="light" accent="violet"/>
    <div className="grid gap-5 xl:grid-cols-3">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Gift className="size-5"/> Loyalty & Referral</CardTitle></CardHeader><CardContent className="space-y-3">
        <Label>Member ID</Label><Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member UUID"/>
        <div className="grid grid-cols-2 gap-2"><Input value={points} onChange={e=>setPoints(e.target.value)} type="number"/><Input value={reason} onChange={e=>setReason(e.target.value)}/></div>
        <div className="flex gap-2">{hasPermission("loyalty.manage")&&<Button onClick={()=>void run(()=>api.post("/loyalty/"+memberId+"/adjust",{points:Number(points),reason}),"Points updated")}>Adjust points</Button>}{hasPermission("referrals.manage")&&<Button variant="outline" onClick={()=>void run(()=>api.post("/referrals/"+memberId),"Referral code created")}>Create referral</Button>}</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Headphones className="size-5"/> Support & Feedback</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input value={ticket.subject} onChange={e=>setTicket({...ticket,subject:e.target.value})} placeholder="Ticket subject"/><Input value={ticket.description} onChange={e=>setTicket({...ticket,description:e.target.value})} placeholder="Description"/>
        <Button disabled={!ticket.subject||!ticket.description} onClick={()=>void run(()=>api.post("/support/tickets",ticket),"Ticket created")}>Create ticket</Button>
        <div className="border-t pt-3"><Input value={survey.name} onChange={e=>setSurvey({...survey,name:e.target.value})} placeholder="Survey name"/><Button className="mt-2" variant="outline" onClick={()=>void run(()=>api.post("/feedback/surveys",survey),"Survey created")}>Create NPS/CSAT survey</Button></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="size-5"/> Marketing Automation</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input value={campaign.name} onChange={e=>setCampaign({...campaign,name:e.target.value})} placeholder="Campaign name"/><select className="h-10 w-full rounded-xl border bg-background px-3" value={campaign.channel} onChange={e=>setCampaign({...campaign,channel:e.target.value})}><option>EMAIL</option><option>WHATSAPP</option><option>SMS</option></select><Input value={campaign.templateKey} onChange={e=>setCampaign({...campaign,templateKey:e.target.value})} placeholder="Template key or message"/>
        <Button onClick={()=>void run(()=>api.post("/marketing/campaigns",campaign),"Campaign created")}>Create campaign</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ReceiptIndianRupee className="size-5"/> Accounting / Tax</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2"><Input value={account.code} onChange={e=>setAccount({...account,code:e.target.value})}/><Input value={account.name} onChange={e=>setAccount({...account,name:e.target.value})}/></div>
        <Button onClick={()=>void run(()=>api.post("/accounting/accounts",account),"Account created")}>Create account</Button>
        <Button variant="outline" onClick={()=>void run(()=>api.get("/accounting/trial-balance"),"Trial balance loaded")}>Trial balance</Button>
        <Button variant="outline" onClick={()=>void run(()=>api.get("/accounting/tax-summary"),"Tax summary loaded")}>Tax summary</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="size-5"/> PT Intelligence</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member UUID"/>
        <Button onClick={()=>void run(()=>api.get("/pt-intelligence/"+memberId),"PT intelligence loaded")}>Analyze member</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-5"/> Global AI Command</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input value={aiCommand} onChange={e=>setAiCommand(e.target.value)} placeholder="Ask anything about your gym..."/>
        <Button onClick={()=>void run(()=>api.post("/global-ai/command",{command:aiCommand}),"AI command completed")}><Sparkles className="mr-2 size-4"/>Run command</Button>
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5"/> Member Portal & Kiosk</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={()=>window.open("/member-portal","_blank")}><Star className="mr-2 size-4"/>Member Portal</Button>
      <Button variant="outline" onClick={()=>window.open("/kiosk","_blank")}><Tablet className="mr-2 size-4"/>Kiosk</Button>
    </CardContent></Card>
    {output!==null&&<Card><CardHeader><CardTitle>Latest result</CardTitle></CardHeader><CardContent><pre className="max-h-[420px] overflow-auto rounded-xl bg-muted p-4 text-xs">{JSON.stringify(output,null,2)}</pre></CardContent></Card>}
  </div>
}
