"use client";

import * as React from "react";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAiChat } from "@/lib/hooks/use-ai-chat";
import { ApiError } from "@/lib/api/client";

export function MemberAiProgress({ memberId }: { memberId: string }) {
  const ai = useAiChat();
  const [insight, setInsight] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function analyze() {
    setError(null);
    setInsight(null);
    try {
      const response = await ai.mutateAsync({
        message:
          `Analyze workout progress for member ${memberId}. Use only verified workout execution history available through your tools. ` +
          `Identify adherence, completed-session trend, logged volume trend, exercise progression when exercise-level data is available, ` +
          `plateaus or regressions, and 2-3 actionable coaching recommendations. Do not invent missing data. ` +
          `Clearly distinguish observed facts from coaching recommendations.`,
        history: [],
      });
      setInsight(response.reply);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to generate workout insight.");
    }
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/70 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
            <Brain className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-serif text-xl tracking-tight text-stone-950">
              AI workout progress
            </CardTitle>
            <p className="mt-0.5 text-xs font-medium text-stone-600">
              Evidence-based analysis from verified workout execution data.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1 rounded-full border-violet-200/70 bg-violet-500/10 px-2.5 py-1 text-[10px] font-black tracking-widest text-violet-700">
          <Sparkles className="size-3" aria-hidden="true" /> Verified data
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-6">
        {!insight && !error && (
          <div className="flex flex-col items-start gap-3 rounded-[22px] border border-violet-100/70 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold tracking-tight text-stone-900">Ready to analyze this member</p>
              <p className="mt-1 text-xs font-medium text-stone-600">
                The assistant will inspect available workout history before making recommendations.
              </p>
            </div>
            <Button onClick={() => void analyze()} disabled={ai.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-5 font-extrabold text-white shadow-lg shadow-violet-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
              <TrendingUp className="size-4" aria-hidden="true" />
              {ai.isPending ? "Analyzing..." : "Analyze progress"}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-[22px] border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-5 text-sm" role="alert">
            <p className="font-extrabold text-stone-900">Analysis failed</p>
            <p className="mt-1 text-xs font-medium text-stone-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-3 min-h-11 rounded-2xl" onClick={() => void analyze()} disabled={ai.isPending}>
              Try again
            </Button>
          </div>
        )}

        {insight && (
          <div className="rounded-[22px] border border-stone-200/70 bg-white/80 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold tracking-tight text-stone-900">Workout intelligence</p>
              <Button variant="ghost" size="sm" className="min-h-11 rounded-xl font-bold" onClick={() => void analyze()} disabled={ai.isPending}>
                Refresh
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
