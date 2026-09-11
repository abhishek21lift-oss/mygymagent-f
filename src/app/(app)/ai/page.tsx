"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Send, Sparkles, Wrench, Zap, Dumbbell, Users, CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAiChat } from "@/lib/hooks/use-ai-chat";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatToolCall } from "@/lib/types/ai";

interface DisplayMessage extends ChatMessage {
  toolCalls?: ChatToolCall[];
}

const PROMPTS = [
  { icon: Users, label: "Who hasn't visited in 2 weeks?", tint: "hover:border-rose-200 hover:bg-rose-50/60" },
  { icon: Dumbbell, label: "Draft a 4-day hypertrophy split", tint: "hover:border-violet-200 hover:bg-violet-50/60" },
  { icon: CalendarCheck, label: "Summarize today's attendance", tint: "hover:border-cyan-200 hover:bg-cyan-50/60" },
];

function ToolCallChips({ toolCalls }: { toolCalls: ChatToolCall[] }) {
  if (toolCalls.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {toolCalls.map((tc, i) => (
        <Badge key={i} variant="outline" className="gap-1 rounded-full border-white/20 bg-white/10 font-normal text-white/80">
          <Wrench className="size-3" aria-hidden="true" />
          {tc.name}
        </Badge>
      ))}
    </div>
  );
}

export default function AiPage() {
  const [messages, setMessages] = React.useState<DisplayMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [notConfigured, setNotConfigured] = React.useState(false);
  const chat = useAiChat();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(prefill?: string) {
    const trimmed = (prefill ?? input).trim();
    if (!trimmed || chat.isPending) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");

    try {
      const res = await chat.mutateAsync({ message: trimmed, history });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, toolCalls: res.toolCalls },
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setNotConfigured(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              error instanceof ApiError
                ? `Something went wrong: ${error.message}`
                : "Something went wrong. Try again.",
          },
        ]);
      }
    }
  }

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section
          aria-labelledby="ai-title"
          className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0f0c29_0%,#302b63_38%,#6d28d9_68%,#be185d_100%)] p-6 text-white shadow-[0_35px_110px_-48px_rgba(79,70,229,.65)] sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-cyan-400/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-fuchsia-400/30 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-violet-400/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-white backdrop-blur">
                <Sparkles className="size-3.5" aria-hidden="true" /> MyGymAgent AI
              </div>
              <h1 id="ai-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-balance sm:text-5xl lg:text-6xl">
                AI Assistant
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/75">
                Ask about members, workout history, and attendance — or have it draft a workout or a lead follow-up.
              </p>
            </div>
            <Link
              href="/ai-actions"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-950 shadow-[0_16px_40px_-16px_rgba(255,255,255,.5)] transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Zap className="size-4" aria-hidden="true" />
              Review AI actions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {notConfigured ? (
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl backdrop-blur-xl">
            <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-[19px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-2 font-serif text-xl font-semibold text-stone-950">AI isn&apos;t configured yet</p>
              <p className="max-w-sm text-sm font-medium text-stone-600">
                An administrator needs to set an OpenRouter API key on the backend before the
                assistant can respond.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <section aria-label="Conversation" className="flex min-h-[480px] flex-col overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60 px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Conversation</h2>
                  <p className="text-xs font-medium text-stone-600">Grounded in your gym&apos;s live data.</p>
                </div>
                {chat.isPending && <span className="ml-auto rounded-full bg-violet-500/10 px-3 py-1 text-[11px] font-black text-violet-700">THINKING…</span>}
              </div>
              <div className="h-[420px] flex-1 overflow-y-auto p-4 sm:p-5" role="log" aria-live="polite" aria-label="AI conversation">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <span className="flex size-14 items-center justify-center rounded-[19px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                      <Sparkles className="size-6" aria-hidden="true" />
                    </span>
                    <p className="max-w-sm font-serif text-lg font-semibold text-stone-900">What should we solve today?</p>
                    <p className="max-w-sm text-xs font-medium text-stone-600">
                      Try: &quot;What&apos;s the attendance history for [member name]?&quot;
                    </p>
                    <div className="mt-2 grid w-full max-w-md gap-2">
                      {PROMPTS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => void handleSend(p.label)}
                          className={`flex min-h-11 items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-3 text-left text-xs font-bold text-stone-700 transition hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${p.tint}`}
                        >
                          <p.icon className="size-4 shrink-0 text-violet-600" aria-hidden="true" />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm",
                            m.role === "user"
                              ? "bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] text-white shadow-violet-500/25"
                              : "border border-violet-100/80 bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 text-stone-900",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.toolCalls && <ToolCallChips toolCalls={m.toolCalls} />}
                        </div>
                      </div>
                    ))}
                    {chat.isPending && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-[20px] border border-violet-100 bg-violet-50/60 px-4 py-3 text-sm font-bold text-violet-700">
                          <span className="size-2 animate-pulse rounded-full bg-violet-500" aria-hidden="true" />
                          Thinking…
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
              <div className="border-t border-stone-100/80 bg-white/60 p-4">
                <div className="flex gap-2">
                  <label htmlFor="ai-input" className="sr-only">Ask the assistant</label>
                  <Textarea
                    id="ai-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Ask the assistant..."
                    rows={2}
                    className="min-h-11 resize-none rounded-2xl border-stone-200 bg-white focus-visible:ring-violet-600"
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={chat.isPending || !input.trim()}
                    className="min-h-11 min-w-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] shadow-lg shadow-violet-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                    aria-label="Send message"
                  >
                    <Send className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-2 text-[11px] font-medium text-stone-600">Enter to send · Shift + Enter for a new line. AI drafts never execute without approval.</p>
              </div>
            </section>

            <aside aria-label="AI tips" className="flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#172554,#3730a3_45%,#a21caf)] p-6 text-white shadow-[0_28px_75px_-38px_rgba(79,70,229,.78)]">
                <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
                <h2 className="relative font-serif text-xl font-semibold tracking-tight">Grounded answers</h2>
                <p className="relative mt-2 text-xs font-medium leading-5 text-white/70">
                  The assistant reads live members, attendance, plans and pipeline — then proposes actions you approve.
                </p>
                <Link
                  href="/ai-actions"
                  className="relative mt-5 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-extrabold text-indigo-950 shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Open approval queue <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
              <Card className="border-white/90 bg-white/85 backdrop-blur-xl">
                <CardContent className="space-y-3 p-5">
                  <h2 className="text-xs font-black uppercase tracking-[.18em] text-stone-500">Power prompts</h2>
                  {["Flag members likely to churn this week", "Write a win-back message for lapsed members", "Plan tomorrow's floor staffing from attendance"].map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => void handleSend(tip)}
                      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border border-stone-200/70 bg-white/70 px-4 py-3 text-left text-xs font-bold text-stone-700 transition hover:-translate-y-px hover:border-violet-200 hover:bg-violet-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                    >
                      {tip}
                      <ArrowRight className="size-3.5 shrink-0 text-violet-600" aria-hidden="true" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
