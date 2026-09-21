"use client"
import * as React from "react"
import { api } from "@/lib/api/client"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
export default function MemberPortal(){
 const [token,setToken]=React.useState(()=>typeof window!=="undefined"?new URLSearchParams(window.location.search).get("token")||"":"" )
 const [data,setData]=React.useState<unknown>(null)
 React.useEffect(()=>{if(token) void load(token)},[token])
 async function load(t:string){try{setData(await api.get("/portal/bootstrap/"+encodeURIComponent(t)))}catch{}}
 const view=data as {member:{firstName:string;lastName:string;email?:string;phone?:string};memberships:unknown[];attendance:unknown[]} | null\n return <main className="min-h-svh bg-background p-6"><div className="mx-auto max-w-4xl space-y-6"><Card><CardHeader><CardTitle>Member Portal</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={token} onChange={e=>setToken(e.target.value)} placeholder="Portal token"/><Button onClick={()=>void load(token)}>Open portal</Button></CardContent></Card>{view&&<div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>{view.member.firstName} {view.member.lastName}</CardTitle></CardHeader><CardContent>{view.member.email}<br/>{view.member.phone}</CardContent></Card><Card><CardHeader><CardTitle>Memberships</CardTitle></CardHeader><CardContent><pre className="text-xs">{JSON.stringify(view.memberships,null,2)}</pre></CardContent></Card><Card className="md:col-span-2"><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent><pre className="text-xs">{JSON.stringify(view.attendance,null,2)}</pre></CardContent></Card></div>}</div></main>
}
