"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, Pencil, Plus, Tag } from "lucide-react";

import { ConfirmAction } from "@/components/shared/confirm-action";
import { DataState } from "@/components/shared/data-state";
import { PageHero } from "@/components/shared/page-hero";
import { Panel } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useCreateMemberTag,
  useDeleteMemberTag,
  useMemberTags,
  useUpdateMemberTag,
  type MemberTag,
} from "@/lib/hooks/use-member-tags";

/** The colours a tag can take: distinct, and readable as white text. */
const TAG_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#64748b"];

function ColorPicker({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className="flex size-8 items-center justify-center rounded-full outline-none ring-offset-2 ring-offset-card focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: color }}
        >
          {value === color ? <Check className="size-4 text-white" aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  );
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 409) return "A tag with that name already exists.";
  return error instanceof ApiError ? error.message : fallback;
}

function TagRow({ tag, canEdit }: { tag: MemberTag; canEdit: boolean }) {
  const update = useUpdateMemberTag();
  const remove = useDeleteMemberTag();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(tag.name);
  const [color, setColor] = React.useState(tag.color);
  const count = tag._count?.assignments ?? 0;

  async function save() {
    if (!name.trim()) return;
    try {
      await update.mutateAsync({ tagId: tag.id, name: name.trim(), color });
      setEditing(false);
      toast.success("Tag updated");
    } catch (error) {
      toast.error(errorText(error, "Could not update the tag"));
    }
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-3 py-3">
        <Input aria-label="Tag name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
        <ColorPicker value={color} onChange={setColor} label="Tag colour" />
        <div className="flex gap-2">
          <Button size="sm" className="min-h-10" onClick={() => void save()} disabled={!name.trim() || update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-10"
            onClick={() => {
              setEditing(false);
              setName(tag.name);
              setColor(tag.color);
            }}
          >
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-full px-3 py-1 text-sm font-semibold text-white [overflow-wrap:anywhere]" style={{ backgroundColor: tag.color }}>
          {tag.name}
        </span>
        <span className="text-sm text-muted-foreground">
          {count} member{count === 1 ? "" : "s"}
        </span>
      </div>
      {canEdit ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="min-h-10" onClick={() => setEditing(true)} aria-label={`Edit ${tag.name}`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
          <ConfirmAction
            label="Delete"
            title={`Delete "${tag.name}"?`}
            description={
              count
                ? `It comes off ${count} member${count === 1 ? "" : "s"}. The members themselves are not changed.`
                : "No member carries it, so nothing else changes."
            }
            confirmLabel="Delete tag"
            pendingLabel="Deleting..."
            successMessage="Tag deleted"
            errorMessage="Could not delete the tag."
            onConfirm={() => remove.mutateAsync(tag.id)}
            className="min-h-10"
          />
        </div>
      ) : null}
    </li>
  );
}

/**
 * The gym's member tags: create, rename, recolour and delete. Tags were
 * only assignable from a member's profile, so a gym had no way to make
 * its first one.
 */
export default function MemberTagsPage() {
  const { hasPermission } = useAuth();
  const canRead = hasPermission(["members.read", "members.read_assigned"]);
  const canEdit = hasPermission("members.update");
  const tags = useMemberTags();
  const create = useCreateMemberTag();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(TAG_COLORS[0]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), color });
      setName("");
      toast.success("Tag created");
    } catch (error) {
      toast.error(errorText(error, "Could not create the tag"));
    }
  }

  const rows = [...(tags.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-5 pb-10">
      <Link href="/settings" className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Settings
      </Link>
      <PageHero
        eyebrow="Members"
        icon={Tag}
        title="Member tags"
        description="Group members your way (morning batch, students, corporate) to filter lists and target messages."
      />

      {!canRead ? (
        <p className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Your role can&apos;t see member tags.
        </p>
      ) : (
        <Panel title="Tags" titleId="member-tags-list">
          {canEdit ? (
            <form onSubmit={(e) => void add(e)} className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input aria-label="New tag name" placeholder="New tag, e.g. Morning batch" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="sm:max-w-sm" />
                <Button type="submit" className="min-h-11" disabled={!name.trim() || create.isPending}>
                  <Plus className="size-4" aria-hidden="true" />
                  {create.isPending ? "Creating…" : "Create tag"}
                </Button>
              </div>
              <ColorPicker value={color} onChange={setColor} label="New tag colour" />
            </form>
          ) : null}
          <DataState
            isLoading={tags.isPending}
            isError={tags.isError}
            onRetry={() => void tags.refetch()}
            errorMessage="Tags could not be loaded."
            isEmpty={rows.length === 0}
            emptyTitle="No tags yet"
            emptyDescription={canEdit ? "Create the first one above." : "Ask a manager to create some."}
          >
            <ul className="divide-y divide-border/70">
              {rows.map((tag) => (
                <TagRow key={tag.id} tag={tag} canEdit={canEdit} />
              ))}
            </ul>
          </DataState>
        </Panel>
      )}
    </div>
  );
}
