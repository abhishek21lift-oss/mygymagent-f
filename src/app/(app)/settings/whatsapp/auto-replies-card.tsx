"use client"

import * as React from "react"
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import {
  useAutoReplies,
  useCreateAutoReply,
  useDeleteAutoReply,
  useUpdateAutoReply,
  type AutoReplyRule,
} from "@/lib/hooks/use-auto-replies"

const MATCH_TYPES = [
  { value: "EXACT", label: "Exact match" },
  { value: "CONTAINS", label: "Contains" },
  { value: "REGEX", label: "Regex" },
] as const

const SCOPES = [
  { value: "ALL", label: "All chats" },
  { value: "PRIVATE", label: "1:1 only" },
  { value: "GROUP", label: "Groups only" },
] as const

type MatchType = "EXACT" | "CONTAINS" | "REGEX"
type Scope = "ALL" | "PRIVATE" | "GROUP"

/** A saved REGEX rule with a broken pattern never fires (matcher skips it). */
function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern, "i")
    return true
  } catch {
    return false
  }
}

interface FormState {
  keyword: string
  matchType: MatchType
  scope: Scope
  answer: string
  enabled: boolean
  priority: number
}

export function AutoRepliesCard({ canManage }: { canManage: boolean }) {
  const { hasPermission } = useAuth()
  const list = useAutoReplies()
  const create = useCreateAutoReply()
  const update = useUpdateAutoReply()
  const remove = useDeleteAutoReply()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AutoReplyRule | null>(null)
  const [form, setForm] = React.useState<FormState>({
    keyword: "",
    matchType: "EXACT",
    scope: "ALL",
    answer: "",
    enabled: true,
    priority: 0,
  })
  const [error, setError] = React.useState<string | null>(null)

  function openEdit(rule: AutoReplyRule) {
    setForm({
      keyword: rule.keyword,
      matchType: rule.matchType,
      scope: rule.scope,
      answer: rule.answer,
      enabled: rule.enabled,
      priority: rule.priority,
    })
    setEditing(rule)
    setOpen(true)
  }

  async function handleSubmit() {
    setError(null)
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: { ...form } })
        toast.success("Rule updated")
      } else {
        await create.mutateAsync(form)
        toast.success("Rule created")
      }
      setOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save rule.")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this auto-reply rule?")) return
    try {
      await remove.mutateAsync(id)
      toast.success("Rule deleted")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete rule.")
    }
  }

  async function handleToggle(rule: AutoReplyRule) {
    try {
      await update.mutateAsync({ id: rule.id, input: { enabled: !rule.enabled } })
      toast.success(rule.enabled ? "Rule disabled" : "Rule enabled")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update rule.")
    }
  }

  if (!hasPermission("whatsapp.read")) {
    return (
      <Card className="overflow-hidden border-border bg-card dark:bg-card">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">Auto-replies</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="You need whatsapp.read permission to view auto-replies." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="auto-replies" className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
              <Plus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">Auto-replies</CardTitle>
              <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Staff keyword rules and #help/#stop/#start bot.</p>
            </div>
          </div>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={create.isPending} className="min-h-11">
                  {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
                  Add rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit rule" : "New auto-reply rule"}</DialogTitle>
                  <DialogDescription>Keyword, match type, scope, and answer. Rules fire before gym intents.</DialogDescription>
                </DialogHeader>
                {error && <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">{error}</p>}
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ar-keyword">Keyword</Label>
                    <Input
                      id="ar-keyword"
                      value={form.keyword}
                      onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                      placeholder="offer"
                      maxLength={200}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ar-match">Match type</Label>
                      <Select value={form.matchType} onValueChange={(v) => setForm({ ...form, matchType: v as MatchType })}>
                        <SelectTrigger id="ar-match" className="min-h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MATCH_TYPES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ar-scope">Scope</Label>
                      <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as Scope })}>
                        <SelectTrigger id="ar-scope" className="min-h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCOPES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ar-priority">Priority (lower = higher priority)</Label>
                    <Input
                      id="ar-priority"
                      type="number"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ar-answer">Answer</Label>
                    <Textarea
                      id="ar-answer"
                      value={form.answer}
                      onChange={(e) => setForm({ ...form, answer: e.target.value })}
                      rows={3}
                      placeholder="Our plans start at Rs 999/month…"
                      className="min-h-11 rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={form.enabled ? "default" : "outline"}
                      onClick={() => setForm({ ...form, enabled: !form.enabled })}
                      className="min-h-11 rounded-lg"
                    >
                      {form.enabled ? <ToggleRight className="mr-2 h-4 w-4" aria-hidden="true" /> : <ToggleLeft className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {form.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={create.isPending || update.isPending} className="min-h-11">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={create.isPending || update.isPending || form.keyword.trim() === "" || form.answer.trim() === ""} className="min-h-11 bg-primary">
                    {create.isPending || update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {editing ? "Save changes" : "Create rule"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <DataState
          isLoading={list.isPending}
          isError={list.isError}
          onRetry={() => void list.refetch()}
          errorMessage="Could not load auto-reply rules."
          isEmpty={(list.data ?? []).length === 0}
          emptyIcon={Plus}
          emptyTitle="No rules yet"
          emptyDescription="Create your first keyword rule above."
          skeletonRows={3}
        >
          <div className="rounded-lg border border-stone-200/70 bg-card p-4 dark:bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Keyword / Match / Scope</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                      <div className="font-medium text-stone-900 dark:text-stone-100">{rule.keyword}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="rounded-full text-[10px]">{rule.matchType}</Badge>
                        <Badge variant="secondary" className="rounded-full text-[10px]">{rule.scope}</Badge>
                        {rule.matchType === "REGEX" && !isValidRegex(rule.keyword) && (
                          <Badge variant="destructive" className="rounded-full text-[10px]">invalid regex — never fires</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="whitespace-pre-line text-sm font-medium text-stone-600 dark:text-stone-400 [overflow-wrap:anywhere]">{rule.answer}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-stone-600 dark:text-stone-400">{rule.priority}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant={rule.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggle(rule)}
                        disabled={update.isPending || !canManage}
                        className="min-h-8 rounded-lg"
                      >
                        {rule.enabled ? <ToggleRight className="h-4 w-4" aria-hidden="true" /> : <ToggleLeft className="h-4 w-4" aria-hidden="true" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(rule)}
                            disabled={update.isPending}
                            className="min-h-8"
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            disabled={remove.isPending}
                            className="min-h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataState>
      </CardContent>
    </Card>
  )
}