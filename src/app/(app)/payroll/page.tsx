"use client";

import * as React from "react";
import { HandCoins, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";

type SummaryRow = { trainerId: string; trainerName?: string; baseAmount: string | number; commissionAmount: string | number; sessions: number };
type Rule = { id: string; trainerId: string; percentage: string | number; fixedAmount: string | number; sessionType?: string | null };

export default function PayrollPage() {
  const [summary, setSummary] = React.useState<SummaryRow[]>([]);
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        api.get<SummaryRow[]>("/payroll/summary"),
        api.get<Rule[]>("/payroll/commission-rules"),
      ]);
      setSummary(s);
      setRules(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payroll data could not be loaded");
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  async function generate() {
    setGenerating(true);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const result = await api.post<{ scanned: number; created: number }>("/payroll/commissions/generate", { from, to });
      toast.success(`Commission run complete: ${result.created} new entries`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Commission run failed");
    } finally { setGenerating(false); }
  }

  return (
    <main className="space-y-8">
      <PageHero title="Payroll & Commissions" icon={HandCoins}
        actions={<Button onClick={generate} disabled={generating}><RefreshCw className="mr-2 size-4" />{generating ? "Generating…" : "Generate commissions"}</Button>} />
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm"><p className="text-sm text-stone-500">Trainers with commissions</p><p className="mt-2 text-3xl font-black">{summary.length}</p></div>
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm"><p className="text-sm text-stone-500">Sessions</p><p className="mt-2 text-3xl font-black">{summary.reduce((n, x) => n + Number(x.sessions || 0), 0)}</p></div>
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm"><p className="text-sm text-stone-500">Commission payable</p><p className="mt-2 text-3xl font-black">₹{summary.reduce((n, x) => n + Number(x.commissionAmount || 0), 0).toLocaleString()}</p></div>
      </section>
      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Commission summary</h2><span className="text-sm text-stone-500">{loading ? "Loading…" : `${summary.length} trainers`}</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="py-3">Trainer</th><th>Sessions</th><th>Base</th><th>Commission</th></tr></thead><tbody>{summary.map((x) => <tr key={x.trainerId} className="border-b last:border-0"><td className="py-3 font-bold">{x.trainerName || x.trainerId}</td><td>{x.sessions}</td><td>₹{Number(x.baseAmount).toLocaleString()}</td><td className="font-black">₹{Number(x.commissionAmount).toLocaleString()}</td></tr>)}{!loading && summary.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-stone-500">No commission entries yet. Create trainer rules and generate the current period.</td></tr>}</tbody></table></div>
      </section>
      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm"><h2 className="mb-4 text-xl font-black">Commission rules</h2><div className="space-y-3">{rules.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between rounded-2xl border p-4"><span className="font-bold">{r.trainerId}</span><span>{Number(r.percentage)}% + ₹{Number(r.fixedAmount)}</span><span className="text-sm text-stone-500">{r.sessionType || "All sessions"}</span></div>)}{rules.length === 0 && <p className="text-sm text-stone-500">No rules configured yet.</p>}</div></section>
    </main>
  );
}
