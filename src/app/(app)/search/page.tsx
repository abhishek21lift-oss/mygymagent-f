"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Input } from "@/components/ui/input";

type Result = { id: string; type: string; title: string; subtitle?: string | null; href?: string | null };

export default function SearchPage() {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { const data = await api.get<{ results: Result[] }>("/search", { query: { q } }); setResults(data.results); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);
  return <main className="space-y-8"><PageHero title="Global Search" icon={SearchIcon} />
    <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
      <div className="relative"><SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" /><Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, phone, SKU or invoice number…" className="h-14 rounded-2xl pl-12 text-base" /></div>
      <div className="mt-5 space-y-2">{loading && <p className="text-sm text-stone-500">Searching…</p>}{results.map(r => <Link key={`${r.type}-${r.id}`} href={r.href || "#"} className="flex items-center justify-between rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div><p className="font-black">{r.title}</p><p className="text-sm text-stone-500">{r.subtitle || r.type}</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase">{r.type}</span></Link>)}{q.length >= 2 && !loading && results.length === 0 && <p className="py-8 text-center text-sm text-stone-500">No matches.</p>}</div>
    </section>
  </main>;
}
