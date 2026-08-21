"use client";

import * as React from "react";
import { Send, Sparkles, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
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

function ToolCallChips({ toolCalls }: { toolCalls: ChatToolCall[] }) {
  if (toolCalls.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {toolCalls.map((tc, i) => (
        <Badge key={i} variant="outline" className="gap-1 font-normal">
          <Wrench className="size-3" />
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

  async function handleSend() {
    const trimmed = input.trim();
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
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <PageHeader
        title="AI Assistant"
        description="Ask about members, workout history, and attendance, or have it draft a workout or a lead follow-up"
      />

      {notConfigured ? (
        <Card className="flex flex-1 items-center justify-center">
          <CardContent className="flex flex-col items-center gap-2 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <p className="font-medium">AI isn&apos;t configured yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              An administrator needs to set an OpenRouter API key on the backend before the
              assistant can respond.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto rounded-lg border">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Sparkles className="size-8" />
                <p className="text-sm">
                  Try: &quot;What&apos;s the attendance history for [member name]?&quot;
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.toolCalls && <ToolCallChips toolCalls={m.toolCalls} />}
                    </div>
                  </div>
                ))}
                {chat.isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
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
              className="resize-none"
            />
            <Button onClick={() => void handleSend()} disabled={chat.isPending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
