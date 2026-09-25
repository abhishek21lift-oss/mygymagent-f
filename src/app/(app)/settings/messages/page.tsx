"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare, Trash2 } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useCreateMessageTemplate,
  useDeleteMessageTemplate,
  useMessageLogs,
  useMessageTemplates,
  useUpdateMessageTemplate,
  type CommunicationChannel,
  type MessageTemplate,
} from "@/lib/hooks/use-communications";

const CHANNELS: CommunicationChannel[] = ["EMAIL", "WHATSAPP", "SMS", "PUSH"];

function fail(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError ? error.message : fallback);
}

const EMPTY = { key: "", channel: "EMAIL" as CommunicationChannel, subject: "", body: "" };

/**
 * The words this product sends, and whether they arrived.
 *
 * Every message the system sends -- renewal reminders, receipts, the
 * WhatsApp flows -- renders from a template, and all five endpoints
 * behind them had no caller. Changing a word meant a database client, and
 * "did the reminder actually go out?" had no answer inside the app.
 *
 * It sits under Settings beside notification preferences because that is
 * the grant it shares: all five are `notifications.manage`, and the
 * preferences page next door decides which of these messages a member
 * receives at all.
 *
 * A template with no organization is the platform default. Deleting an
 * override does not stop the message; it falls back to that default,
 * which is why the button says Reset rather than Delete on those rows.
 */
export default function MessageTemplatesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("notifications.manage");

  const templates = useMessageTemplates(canManage);
  const logs = useMessageLogs(100, canManage);
  const create = useCreateMessageTemplate();
  const update = useUpdateMessageTemplate();
  const remove = useDeleteMessageTemplate();

  const [editing, setEditing] = React.useState<MessageTemplate | null>(null);
  const [draft, setDraft] = React.useState(EMPTY);

  const startEdit = (template: MessageTemplate) => {
    setEditing(template);
    setDraft({
      key: template.key,
      channel: template.channel,
      subject: template.subject ?? "",
      body: template.body,
    });
  };

  const reset = () => {
    setEditing(null);
    setDraft(EMPTY);
  };

  async function save() {
    const input = {
      key: draft.key.trim(),
      channel: draft.channel,
      body: draft.body,
      ...(draft.subject ? { subject: draft.subject } : {}),
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...input });
        toast.success("Template updated");
      } else {
        await create.mutateAsync(input);
        toast.success("Template created");
      }
      reset();
    } catch (error) {
      fail(error, "Could not save the template");
    }
  }

  if (!canManage) {
    return (
      <main className="space-y-6">
        <PageHero icon={Mail} title="Message templates" />
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage message templates.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <PageHero
        icon={Mail}
        title="Message templates"
        description="The wording behind every reminder, receipt and notification."
      />

      <Panel
        title={editing ? `Editing ${editing.key}` : "New template"}
        titleId="template-editor"
        description="An organization template overrides the platform default for the same key and channel."
        actions={
          editing ? (
            <Button variant="outline" size="sm" onClick={reset}>
              Cancel
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.6fr)]">
            <Input
              aria-label="Template key"
              placeholder="membership.renewal_reminder"
              value={draft.key}
              onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
              disabled={Boolean(editing)}
            />
            <select
              aria-label="Channel"
              value={draft.channel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, channel: e.target.value as CommunicationChannel }))
              }
              disabled={Boolean(editing)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground disabled:opacity-50"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Input
              aria-label="Subject"
              placeholder="Subject (email only)"
              value={draft.subject}
              onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
            />
          </div>
          <Textarea
            aria-label="Body"
            placeholder="Hi {{firstName}}, your membership expires on {{endDate}}…"
            className="min-h-32 font-mono text-xs"
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          />
          <div>
            <Button
              disabled={!draft.key || !draft.body || create.isPending || update.isPending}
              onClick={() => void save()}
            >
              {(create.isPending || update.isPending) && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {editing ? "Save changes" : "Create template"}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Templates" titleId="templates" flush>
        <DataState
          isLoading={templates.isPending}
          isError={templates.isError}
          onRetry={() => void templates.refetch()}
          errorMessage="Could not load message templates."
          isEmpty={(templates.data ?? []).length === 0}
          emptyIcon={Mail}
          emptyTitle="No templates"
          emptyDescription="Every message falls back to its platform default until one is created here."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(templates.data ?? []).map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-xs">{template.key}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{template.channel}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {template.subject ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(template)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={remove.isPending}
                        onClick={() =>
                          void remove
                            .mutateAsync(template.id)
                            .then(() => {
                              if (editing?.id === template.id) reset();
                              toast.success("Reset to the platform default");
                            })
                            .catch((error) => fail(error, "Could not reset the template"))
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Reset
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Panel>

      <Panel
        title="Delivery log"
        titleId="delivery-log"
        description="The last 100 messages this organization sent."
        flush
      >
        <DataState
          isLoading={logs.isPending}
          isError={logs.isError}
          onRetry={() => void logs.refetch()}
          errorMessage="Could not load the delivery log."
          isEmpty={(logs.data ?? []).length === 0}
          emptyIcon={MessageSquare}
          emptyTitle="Nothing sent yet"
          emptyDescription="Messages appear here as they are queued and delivered."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs.data ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {new Date(entry.sentAt ?? entry.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{entry.templateKey}</TableCell>
                  <TableCell>{entry.channel}</TableCell>
                  <TableCell className="max-w-[14rem] truncate">{entry.recipient}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "FAILED"
                          ? "destructive"
                          : entry.status === "PENDING"
                            ? "secondary"
                            : "success"
                      }
                      title={entry.errorMessage ?? undefined}
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Panel>
    </main>
  );
}
