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
    <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-card to-card shadow-sm ring-1 ring-primary/15">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4 text-primary" />
            AI workout progress
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Evidence-based analysis from verified workout execution data.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="size-3" /> Verified data
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insight && !error && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Ready to analyze this member</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The assistant will inspect available workout history before making recommendations.
              </p>
            </div>
            <Button onClick={() => void analyze()} disabled={ai.isPending} className="gap-2 rounded-xl">
              <TrendingUp className="size-4" />
              {ai.isPending ? "Analyzing..." : "Analyze progress"}
            </Button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium">Analysis failed</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void analyze()} disabled={ai.isPending}>
              Try again
            </Button>
          </div>
        )}

        {insight && (
          <div className="rounded-2xl border bg-background/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Workout intelligence</p>
              <Button variant="ghost" size="sm" onClick={() => void analyze()} disabled={ai.isPending}>
                Refresh
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6">{insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
