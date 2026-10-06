"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Send, Sparkles, Wrench, Zap, Dumbbell, Users, CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAiChat } from "@/lib/hooks/use-ai-chat";
import { PageHero } from "@/components/shared/page-hero";
import { QuickActionCard } from "@/components/shared/bento";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatToolCall } from "@/lib/types/ai";

interface DisplayMessage extends ChatMessage {
 toolCalls?: ChatToolCall[];
}

const PROMPTS = [
 { icon: Users, label: "Who hasn't visited in 2 weeks?", accent: "rose" as const },
 { icon: Dumbbell, label: "Draft a 4-day hypertrophy split", accent: "violet" as const },
 { icon: CalendarCheck, label: "Summarize today's attendance", accent: "cyan" as const },
];

function ToolCallChips({ toolCalls }: { toolCalls: ChatToolCall[] }) {
 if (toolCalls.length === 0) return null;
 return (
 <div className="mt-2 flex flex-wrap gap-1.5">
 {toolCalls.map((tc, i) => (
 <Badge key={i} variant="outline" className="gap-1 rounded-full border-border bg-card font-normal text-muted-foreground">
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

 // Contextual entry: /ai?q=<question> (e.g. from the COO page) prefills
 // the composer without sending — the human reviews before anything runs.
 React.useEffect(() => {
 try {
 const q = new URLSearchParams(window.location.search).get("q");
 if (q && q.trim()) setInput(q.trim().slice(0, 2000));
 } catch {
 // Non-browser render or malformed URL: leave the composer empty.
 }
 }, []);

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
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="ai-title"
 icon={Sparkles}
 title="AI agent"
 actions={
 <Link
 href="/ai-actions"
 className="btn-sheen inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 <Zap className="size-4" aria-hidden="true" />
 Review AI actions
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 }
 />

 {notConfigured ? (
 <Card className="overflow-hidden border-border bg-card shadow-sm">
 <CardContent className="flex flex-col items-center gap-2 px-6 py-14 text-center">
 <span className="flex size-14 items-center justify-center rounded-2xl text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--a-violet-grad-1), var(--a-violet-grad-2))" }}>
 <Sparkles className="size-6" aria-hidden="true" />
 </span>
 <p className="mt-2 text-base font-semibold text-foreground">AI isn&apos;t configured yet</p>
 <p className="max-w-sm text-sm font-medium text-muted-foreground">
 An administrator needs to set an OpenRouter API key on the backend before the
 assistant can respond.
 </p>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
 <section aria-label="Conversation" className="flex min-h-[480px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
 <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
 <span className="flex size-10 items-center justify-center rounded-xl text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--a-violet-grad-1), var(--a-violet-grad-2))" }}>
 <Sparkles className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="section-title">Conversation</h2>
 </div>
 {chat.isPending && <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">THINKING…</span>}
 </div>
 <div className="h-[420px] flex-1 overflow-y-auto p-4 sm:p-5" role="log" aria-live="polite" aria-label="AI conversation">
 {messages.length === 0 ? (
 <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
 <span className="flex size-14 items-center justify-center rounded-2xl text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--a-violet-grad-1), var(--a-violet-grad-2))" }}>
 <Sparkles className="size-6" aria-hidden="true" />
 </span>
 <p className="max-w-sm text-lg font-semibold text-foreground">What should we solve today?</p>
 <div className="mt-2 grid w-full max-w-md gap-2">
 {PROMPTS.map((p) => (
 <QuickActionCard
 key={p.label}
 icon={p.icon}
 label={p.label}
 accent={p.accent}
 onClick={() => void handleSend(p.label)}
 className="w-full"
 />
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
 className={cn( "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
 m.role === "user"
 ? "text-white"
 : "border border-border bg-muted/40 text-foreground",
 )}
 style={m.role === "user" ? { backgroundImage: "var(--brand-grad)" } : undefined}
 >
 <p className="whitespace-pre-wrap">{m.content}</p>
 {m.toolCalls && <ToolCallChips toolCalls={m.toolCalls} />}
 </div>
 </div>
 ))}
 {chat.isPending && (
 <div className="flex justify-start">
 <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-bold text-foreground">
 <span className="size-2 animate-pulse rounded-full" style={{ background: "var(--ai)" }} aria-hidden="true" />
 Thinking…
 </div>
 </div>
 )}
 <div ref={bottomRef} />
 </div>
 )}
 </div>
 <div className="border-t border-border bg-card p-4">
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
 className="min-h-11 resize-none rounded-xl bg-card"
 />
 <Button
 onClick={() => void handleSend()}
 disabled={chat.isPending || !input.trim()}
 className="btn-sheen min-h-11 min-w-11 rounded-lg bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 aria-label="Send message"
 >
 <Send className="size-4" aria-hidden="true" />
 </Button>
 </div>
 <p className="mt-2 text-xs font-medium text-muted-foreground">Enter to send · Shift + Enter for a new line.</p>
 </div>
 </section>

 <aside aria-label="AI tips" className="flex flex-col gap-4">
 <div className="relative overflow-hidden rounded-3xl p-4 text-white sm:p-5" style={{ backgroundImage: "linear-gradient(135deg, var(--a-violet-grad-1), var(--a-violet-grad-2))" }}>
 <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden="true" />
 <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
 <h2 className="relative text-sm font-semibold tracking-tight">Grounded answers</h2>
 <Link
 href="/ai-actions"
 className="relative mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-card px-4 py-2.5 text-xs font-extrabold text-foreground shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 Open approval queue <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </div>
 <Card className="border-border bg-card">
 <CardContent className="space-y-3 p-5">
 <h2 className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">Power prompts</h2>
 {["Flag members likely to churn this week", "Write a win-back message for lapsed members", "Plan tomorrow's floor staffing from attendance"].map((tip) => (
 <Button
 key={tip}
 type="button"
 variant="outline"
 onClick={() => void handleSend(tip)}
 className="h-auto min-h-11 w-full justify-between whitespace-normal rounded-lg px-4 py-3 text-left text-xs"
 >
 {tip}
 <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
 </Button>
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
