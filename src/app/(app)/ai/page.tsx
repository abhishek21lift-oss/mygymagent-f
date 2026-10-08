"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Send, Sparkles, Wrench, Zap, Dumbbell, Users, CalendarCheck, Bot, History, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAiChat } from "@/lib/hooks/use-ai-chat";
import { fetchAiConversation, useAiConversations, useDeleteAiConversation } from "@/lib/hooks/use-ai-conversations";
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
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {toolCalls.map((tc, i) => (
        <Badge
          key={i}
          variant="outline"
          className="gap-1 rounded-full border-indigo-200/60 bg-indigo-50/50 text-[11px] font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
        >
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
  // The stored chat being continued; null for a new one.
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = React.useState(false);
  const conversations = useAiConversations();
  const deleteConversation = useDeleteAiConversation();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q && q.trim()) setInput(q.trim().slice(0, 2000));
    } catch {
      // Non-browser render or malformed URL
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
      const res = await chat.mutateAsync({ message: trimmed, history, conversationId: conversationId ?? undefined });
      if (res.conversationId) setConversationId(res.conversationId);
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

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setInput("");
  }

  async function openConversation(id: string) {
    if (id === conversationId || chat.isPending) return;
    setLoadingConversation(true);
    try {
      setMessages(await fetchAiConversation(id));
      setConversationId(id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "That chat could not be opened");
    } finally {
      setLoadingConversation(false);
    }
  }

  async function removeConversation(id: string) {
    try {
      await deleteConversation.mutateAsync(id);
      if (id === conversationId) newChat();
      toast.success("Chat deleted");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Chat could not be deleted");
    }
  }

  return (
    <div className="pb-6">
      <div className="flex flex-col gap-6">
        <PageHero
          id="ai-title"
          icon={Sparkles}
          title="AI agent"
          description="Contextual reasoning, member retention forecasting, workout generation and analytics"
          actions={
            <Link
              href="/ai-actions"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Zap className="size-4" aria-hidden="true" />
              Action Approval Center
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />

        {notConfigured ? (
          <Card className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-lg">
                <Sparkles className="size-8" aria-hidden="true" />
              </span>
              <p className="mt-2 text-lg font-bold text-foreground">AI Intelligence isn&apos;t configured yet</p>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                An administrator needs to configure the LLM provider key or FreeLLMAPI endpoint on the backend before the copilot can process instructions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Conversation Window */}
            <section
              aria-label="Conversation"
              className="relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 text-white shadow-xs">
                    <Bot className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{conversationId ? "Saved chat" : "New chat"}</h2>
                    <p className="text-[11px] text-muted-foreground">Chats are saved, so you can come back to them</p>
                  </div>
                </div>
                {messages.length > 0 && !chat.isPending ? (
                  <Button type="button" size="sm" variant="outline" className="min-h-9 rounded-xl" onClick={newChat}>
                    <Plus className="size-4" aria-hidden="true" />
                    New chat
                  </Button>
                ) : null}

                {chat.isPending && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-indigo-500/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-500/20 dark:text-indigo-300">
                    <span className="size-1.5 animate-ping rounded-full bg-indigo-500" />
                    Synthesizing response…
                  </span>
                )}
              </div>

              {/* Message scroll container */}
              <div
                className="h-[460px] flex-1 overflow-y-auto p-5 sm:p-6"
                role="log"
                aria-live="polite"
                aria-label="AI conversation"
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-xl animate-pulse" />
                      <span className="relative flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-xl">
                        <Sparkles className="size-8" aria-hidden="true" />
                      </span>
                    </div>

                    <div className="max-w-md">
                      <p className="text-lg font-black tracking-tight text-foreground">
                        How can I accelerate your gym today?
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ask about attendance patterns, draft personalized split programs, or triage overdue lead follow-ups.
                      </p>
                    </div>

                    <div className="mt-3 grid w-full max-w-md gap-2.5">
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
                          className={cn(
                            "max-w-[85%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-xs transition-all",
                            m.role === "user"
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                              : "border border-border/80 bg-muted/40 text-foreground backdrop-blur-md",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.toolCalls && <ToolCallChips toolCalls={m.toolCalls} />}
                        </div>
                      </div>
                    ))}

                    {chat.isPending && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-3xl border border-indigo-200/60 bg-indigo-50/50 px-4 py-3 text-xs font-bold text-indigo-700 shadow-2xs dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <Sparkles className="size-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                          <span>Generating grounded answer…</span>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border/60 bg-card/95 p-4 backdrop-blur-md">
                <div className="relative flex items-center gap-2 rounded-2xl border border-border/80 bg-background/80 p-1.5 shadow-2xs focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
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
                    placeholder="Ask anything about members, plans, attendance, or workouts..."
                    rows={1}
                    className="min-h-10 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-xs shadow-none focus-visible:ring-0"
                  />
                  <Button
                    onClick={() => void handleSend()}
                    disabled={chat.isPending || !input.trim()}
                    className="size-9 shrink-0 rounded-xl bg-primary p-0 shadow-xs"
                    aria-label="Send message"
                  >
                    <Send className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Press Enter to send · Shift + Enter for newline
                </p>
              </div>
            </section>

            {/* Aside / Suggestions & Tips */}
            <aside aria-label="AI tips" className="flex flex-col gap-4">
              <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm">
                <CardContent className="space-y-2 p-5">
                  <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" aria-hidden="true" />
                    Recent chats
                  </h3>
                  {conversations.isPending ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : (conversations.data ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Your chats will appear here.</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {(conversations.data ?? []).map((c) => (
                        <li key={c.id} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void openConversation(c.id)}
                            disabled={loadingConversation}
                            aria-current={c.id === conversationId ? "true" : undefined}
                            className={cn(
                              "min-h-10 min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-xs transition hover:bg-muted",
                              c.id === conversationId && "bg-primary/10 font-semibold text-foreground",
                            )}
                          >
                            <span className="line-clamp-1">{c.preview || "Untitled chat"}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {new Date(c.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {c.messageCount} message{c.messageCount === 1 ? "" : "s"}
                            </span>
                          </button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 rounded-lg text-muted-foreground"
                            aria-label="Delete chat"
                            disabled={deleteConversation.isPending}
                            onClick={() => void removeConversation(c.id)}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 text-white shadow-md">
                <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-fuchsia-400/30 blur-3xl" aria-hidden="true" />
                <div className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <h3 className="relative text-sm font-bold">Safe Autonomous Actions</h3>
                <p className="relative mt-1 text-xs leading-relaxed text-white/80">
                  AI suggestions that require write permissions are held in the Human-in-the-Loop review queue.
                </p>
                <Link
                  href="/ai-actions"
                  className="relative mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-xs font-bold text-indigo-950 shadow-md transition hover:-translate-y-0.5 hover:bg-white"
                >
                  Review Approvals <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>

              <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Recommended Prompts
                  </h3>
                  {[
                    "Flag members likely to churn this week",
                    "Write a personalized win-back message for lapsed members",
                    "Plan tomorrow's floor staffing from attendance",
                  ].map((tip) => (
                    <Button
                      key={tip}
                      type="button"
                      variant="outline"
                      onClick={() => void handleSend(tip)}
                      className="h-auto min-h-10 w-full justify-between whitespace-normal rounded-xl border-border/60 bg-muted/20 px-3.5 py-2.5 text-left text-xs font-semibold hover:border-primary/30"
                    >
                      <span className="line-clamp-2">{tip}</span>
                      <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
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
