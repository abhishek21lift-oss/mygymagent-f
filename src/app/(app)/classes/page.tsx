"use client"

import * as React from "react"
import { CalendarDays, Loader2, Plus, Users } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useBranches } from "@/lib/hooks/use-branches"
import { PageHero } from "@/components/shared/page-hero"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Program = { id:string; name:string; capacity:number; durationMinutes:number; branchId:string; branchName:string; instructorFirstName?:string|null; instructorLastName?:string|null }
type Session = { id:string; className:string; startTime:string; endTime:string; effectiveCapacity:number; bookedCount:number; waitlistCount:number; branchName:string; instructorFirstName?:string|null; instructorLastName?:string|null }

export default function ClassesPage() {
 const { hasPermission } = useAuth()
 const branches = useBranches({page:1,pageSize:100})
 const [programs,setPrograms]=React.useState<Program[]>([])
 const [sessions,setSessions]=React.useState<Session[]>([])
 const [loading,setLoading]=React.useState(true)
 const [branchId,setBranchId]=React.useState("")
 const [name,setName]=React.useState("")
 const [capacity,setCapacity]=React.useState("20")
 const [duration,setDuration]=React.useState("60")
 const [programId,setProgramId]=React.useState("")
 const [start,setStart]=React.useState("")
 const [end,setEnd]=React.useState("")
 const [memberId,setMemberId]=React.useState("")
 const [busy,setBusy]=React.useState(false)

 const load=React.useCallback(async()=>{
  setLoading(true)
  try {
   const [p,s]=await Promise.all([
    api.get<Program[]>("/classes/programs",{query:{branchId:branchId||undefined}}),
    api.get<Session[]>("/classes/sessions",{query:{branchId:branchId||undefined}})
   ])
   setPrograms(p); setSessions(s); if(!programId && p[0]) setProgramId(p[0].id)
  } catch(e){ toast.error(e instanceof Error?e.message:"Failed to load classes") }
  finally{setLoading(false)}
 },[branchId,programId])

 React.useEffect(()=>{ if(!branchId && branches.data?.items?.[0]) setBranchId(branches.data.items[0].id) },[branchId,branches.data])
 React.useEffect(()=>{void load()},[load])

 async function createProgram(){
  if(!branchId||!name.trim()) return
  setBusy(true)
  try{await api.post("/classes/programs",{branchId,name,capacity:Number(capacity),durationMinutes:Number(duration)});setName("");toast.success("Class program created");await load()}
  catch(e){toast.error(e instanceof Error?e.message:"Failed to create class")}
  finally{setBusy(false)}
 }
 async function createSession(){
  if(!branchId||!programId||!start||!end) return
  setBusy(true)
  try{await api.post("/classes/sessions",{branchId,classProgramId:programId,startTime:new Date(start).toISOString(),endTime:new Date(end).toISOString()});toast.success("Class session scheduled");await load()}
  catch(e){toast.error(e instanceof Error?e.message:"Failed to schedule session")}
  finally{setBusy(false)}
 }
 async function book(id:string){
  if(!memberId.trim()) {toast.error("Enter a member ID first");return}
  setBusy(true)
  try{const r=await api.post<{status:string}>("/classes/sessions/"+id+"/book",{memberId});toast.success(r.status==="WAITLISTED"?"Added to waitlist":"Class booked");await load()}
  catch(e){toast.error(e instanceof Error?e.message:"Booking failed")}
  finally{setBusy(false)}
 }

 if(!hasPermission("classes.read")) return <div className="p-8"><Card><CardContent className="p-8">You do not have permission to view Group Training.</CardContent></Card></div>

 return <div className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6">
  <PageHero id="classes-title" icon={CalendarDays} title="Group Training" variant="light" accent="violet" />
  <div className="flex flex-wrap items-center gap-3">
   <Label htmlFor="class-branch">Branch</Label>
   <select id="class-branch" value={branchId} onChange={e=>setBranchId(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm">
    {branches.data?.items?.map((b:{id:string;name:string})=><option key={b.id} value={b.id}>{b.name}</option>)}
   </select>
   <Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member ID for booking" className="max-w-xs" />
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
   {hasPermission("classes.manage") && <Card><CardHeader><CardTitle>Create class program</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">
    <div className="sm:col-span-3"><Label>Name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Yoga / HIIT / Strength" /></div>
    <div><Label>Capacity</Label><Input type="number" min="1" value={capacity} onChange={e=>setCapacity(e.target.value)} /></div>
    <div><Label>Duration (min)</Label><Input type="number" min="1" value={duration} onChange={e=>setDuration(e.target.value)} /></div>
    <Button disabled={busy||!branchId||!name.trim()} onClick={()=>void createProgram()} className="mt-auto">{busy?<Loader2 className="mr-2 size-4 animate-spin"/>:<Plus className="mr-2 size-4"/>}Create</Button>
   </CardContent></Card>}

   {hasPermission("classes.manage") && <Card><CardHeader><CardTitle>Schedule session</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
    <div className="sm:col-span-2"><Label>Class program</Label><select value={programId} onChange={e=>setProgramId(e.target.value)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm">{programs.map(p=><option key={p.id} value={p.id}>{p.name} · {p.capacity} seats</option>)}</select></div>
    <div><Label>Start</Label><Input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} /></div>
    <div><Label>End</Label><Input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} /></div>
    <Button disabled={busy||!programId||!start||!end} onClick={()=>void createSession()} className="sm:col-span-2">{busy?<Loader2 className="mr-2 size-4 animate-spin"/>:<CalendarDays className="mr-2 size-4"/>}Schedule</Button>
   </CardContent></Card>}
  </div>

  <Card><CardHeader><CardTitle>Upcoming sessions</CardTitle></CardHeader><CardContent>
   {loading?<div className="py-8 text-sm text-muted-foreground">Loading…</div>:sessions.length===0?<div className="py-8 text-sm text-muted-foreground">No sessions scheduled for the current window.</div>:
   <div className="grid gap-3">{sessions.map(s=><div key={s.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
    <div><div className="font-semibold">{s.className}</div><div className="text-sm text-muted-foreground">{new Date(s.startTime).toLocaleString()} · {s.branchName}</div><div className="text-xs text-muted-foreground">{s.instructorFirstName||"Unassigned"} {s.instructorLastName||""}</div></div>
    <div className="flex items-center gap-3"><Badge variant="outline"><Users className="mr-1 size-3"/> {s.bookedCount}/{s.effectiveCapacity}</Badge>{s.waitlistCount>0&&<Badge variant="secondary">{s.waitlistCount} waitlisted</Badge>}{hasPermission("classes.book")&&<Button size="sm" onClick={()=>void book(s.id)} disabled={busy}>Book member</Button>}</div>
   </div>)}</div>}
  </CardContent></Card>
 </div>
}