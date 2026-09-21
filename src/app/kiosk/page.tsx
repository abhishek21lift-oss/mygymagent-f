"use client"
import * as React from "react"
import { api } from "@/lib/api/client"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
export default function Kiosk(){
 const [deviceKey,setDeviceKey]=React.useState("");const [memberId,setMemberId]=React.useState("");const [result,setResult]=React.useState<any>(null)
 return <main className="min-h-svh bg-background p-6"><div className="mx-auto max-w-xl"><Card><CardHeader><CardTitle>Gym Self-Service Kiosk</CardTitle></CardHeader><CardContent className="space-y-4"><Input value={deviceKey} onChange={e=>setDeviceKey(e.target.value)} placeholder="Kiosk device key"/><Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member ID"/><Button className="w-full h-14" onClick={async()=>setResult(await api.post("/kiosk/check-in",{deviceKey,memberId}))}>Check in</Button>{result&&<pre className="rounded-xl bg-muted p-4 text-sm">{JSON.stringify(result,null,2)}</pre>}</CardContent></Card></div></main>
}
