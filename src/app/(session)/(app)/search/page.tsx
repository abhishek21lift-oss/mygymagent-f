"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Input } from "@/components/ui/input";

type Result = { id: string; type: string; title: string; subtitle?: string | null; href?: string | null };

export default function SearchPage() {
 const [q, setQ] = React.useState("");
 const [term, setTerm] = React.useState("");
 // Debounced so each keystroke is not its own request.
 React.useEffect(() => {
  const timer = setTimeout(() => setTerm(q.trim()), 250);
  return () => clearTimeout(timer);
 }, [q]);

 // A query rather than a hand-rolled fetch. The old one wrapped the
 // request in try/finally with no catch, so a failed search fell through
 // to "No matches." -- telling the front desk a member did not exist
 // when the request had simply failed.
 const search = useQuery({
  queryKey: ["global-search", term],
  queryFn: () => api.get<{ results: Result[] }>("/search", { query: { q: term } }),
  enabled: term.length >= 2,
  retry: 1,
 });
 const results = search.data?.results ?? [];
 const settled = term.length >= 2 && !search.isFetching;

 return <main className="space-y-8"><PageHero title="Search" icon={SearchIcon} />
 <section className="rounded-xl border bg-card p-6 shadow-sm">
 <div className="relative"><SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" /><Input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, phone, SKU or invoice number…" className="h-14 rounded-lg pl-12 text-base" aria-label="Search" /></div>
 <div className="mt-5 space-y-2" aria-live="polite">
 {search.isFetching && <p className="text-sm text-stone-500">Searching…</p>}
 {settled && search.isError && (
  <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-500/5 p-4 text-sm">
   <span className="font-semibold text-rose-800 dark:text-rose-300">
    Search failed{search.error instanceof ApiError ? `: ${search.error.message}` : ""}. This is not the same as no results.
   </span>
   <button type="button" onClick={() => void search.refetch()} className="rounded-md border px-3 py-1.5 font-semibold hover:bg-muted">Try again</button>
  </div>
 )}
 {!search.isError && results.map(r => <Link key={`${r.type}-${r.id}`} href={r.href || "#"} className="flex items-center justify-between rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div><p className="font-black">{r.title}</p><p className="text-sm text-stone-500">{r.subtitle || r.type}</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase dark:bg-stone-800">{r.type}</span></Link>)}
 {settled && search.isSuccess && results.length === 0 && <p className="py-8 text-center text-sm text-stone-500">No matches for &ldquo;{term}&rdquo;.</p>}
 </div>
 </section>
 </main>;
}
