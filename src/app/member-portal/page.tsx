"use client"
import * as React from "react"
import { api } from "@/lib/api/client"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
export default function MemberPortal(){
 const [token,setToken]=React.useState("")
 const [data,setData]=React.useState<any>(null)
 React.useEffect(()=>{const t=new URLSearchParams(window.location.search).get("token")||"";setToken(t);if(t) void load(t)},[])
 async function load(t:string){try{setData(await api.get("/portal/bootstrap/"+encodeURIComponent(t)))}catch{}}
 return <main className="min-h-svh bg-background p-6"><div className="mx-auto max-w-4xl space-y-6"><Card><CardHeader><CardTitle>Member Portal</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={token} onChange={e=>setToken(e.target.value)} placeholder="Portal token"/><Button onClick={()=>void load(token)}>Open portal</Button></CardContent></Card>{data&&<div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>{data.member.firstName} {data.member.lastName}</CardTitle></CardHeader><CardContent>{data.member.email}<br/>{data.member.phone}</CardContent></Card><Card><CardHeader><CardTitle>Memberships</CardTitle></CardHeader><CardContent><pre className="text-xs">{JSON.stringify(data.memberships,null,2)}</pre></CardContent></Card><Card className="md:col-span-2"><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent><pre className="text-xs">{JSON.stringify(data.attendance,null,2)}</pre></CardContent></Card></div>}</div></main>
}
