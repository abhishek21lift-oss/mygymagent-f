"use client"

import * as React from "react"
import { Filter, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
 useCreateSegment,
 useDeleteSegment,
 useSegmentFields,
 useSegmentMembers,
 useSegments,
 type SegmentOperator,
 type SegmentRule,
 type SegmentSummary,
} from "@/lib/hooks/use-member-intelligence"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { DataState } from "@/components/shared/data-state"
import { Panel } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"

const OPERATORS: { value: SegmentOperator; label: string }[] = [
 { value: "eq", label: "is" },
 { value: "ne", label: "is not" },
 { value: "gt", label: "more than" },
 { value: "gte", label: "at least" },
 { value: "lt", label: "less than" },
 { value: "lte", label: "at most" },
 { value: "in", label: "is one of" },
 { value: "contains", label: "contains" },
]

type DraftRule = { field: string; operator: SegmentOperator; value: string }

/** A rule's value goes over the wire as the type its field is declared
 * with: a number field compared against the string "30" would never match,
 * and `in` takes a list. */
function toRuleValue(
 raw: string,
 operator: SegmentOperator,
 type: string | undefined,
): SegmentRule["value"] {
 if (operator === "in") {
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean)
  return type === "number" ? parts.map(Number) : parts
 }
 if (type === "number") return Number(raw)
 if (type === "boolean") return raw === "true"
 return raw
}

function CreateSegmentDialog() {
 const [open, setOpen] = React.useState(false)
 return (
  <>
   <Button type="button" size="sm" onClick={() => setOpen(true)}>
    <Plus className="mr-1 size-3.5" aria-hidden="true" />New segment
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>New segment</DialogTitle>
      <DialogDescription>
       A saved rule set. The member count refreshes whenever the segment is read, so it
       follows the gym rather than freezing a list.
      </DialogDescription>
     </DialogHeader>
     {open ? <CreateSegmentForm onDone={() => setOpen(false)} /> : null}
    </DialogContent>
   </Dialog>
  </>
 )
}

function CreateSegmentForm({ onDone }: { onDone: () => void }) {
 const fields = useSegmentFields()
 const create = useCreateSegment()
 const [name, setName] = React.useState("")
 const [description, setDescription] = React.useState("")
 const [rules, setRules] = React.useState<DraftRule[]>([])

 const catalogue = fields.data ?? []
 function fieldType(fieldName: string) {
  return catalogue.find((field) => field.name === fieldName)?.type
 }
 function enumValues(fieldName: string) {
  return catalogue.find((field) => field.name === fieldName)?.enumValues
 }

 function addRule() {
  const first = catalogue[0]
  if (!first) return
  setRules((current) => [...current, { field: first.name, operator: "eq", value: "" }])
 }

 function patchRule(index: number, patch: Partial<DraftRule>) {
  setRules((current) => current.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))
 }

 async function submit(event: React.FormEvent) {
  event.preventDefault()
  if (!name.trim() || rules.length === 0) return
  try {
   await create.mutateAsync({
    name: name.trim(),
    description: description.trim() || undefined,
    rules: rules.map((rule) => ({
     field: rule.field,
     operator: rule.operator,
     value: toRuleValue(rule.value, rule.operator, fieldType(rule.field)),
    })),
   })
   toast.success("Segment saved")
   onDone()
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "Could not save this segment.")
  }
 }

 return (
  <form onSubmit={submit} className="grid gap-4">
   <div className="grid gap-2">
    <Label htmlFor="segment-name">Name</Label>
    <Input
     id="segment-name"
     value={name}
     onChange={(event) => setName(event.target.value)}
     placeholder="Lapsed PT clients"
     required
    />
   </div>
   <div className="grid gap-2">
    <Label htmlFor="segment-description">Description</Label>
    <Input
     id="segment-description"
     value={description}
     onChange={(event) => setDescription(event.target.value)}
     placeholder="What this group is for"
    />
   </div>

   <div className="flex items-center justify-between">
    <p className="text-sm font-bold">Rules</p>
    <Button type="button" variant="outline" size="sm" onClick={addRule} disabled={catalogue.length === 0}>
     <Plus className="mr-1 size-3.5" aria-hidden="true" />Add rule
    </Button>
   </div>
   {rules.length === 0 ? (
    <p className="rounded-lg bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
     Add at least one rule. Rules combine with AND.
    </p>
   ) : (
    <div className="grid gap-2">
     {rules.map((rule, index) => {
      const options = enumValues(rule.field)
      return (
       <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_1fr_auto]">
        <Select value={rule.field} onValueChange={(value) => patchRule(index, { field: value, value: "" })}>
         <SelectTrigger aria-label={`Rule ${index + 1} field`}><SelectValue /></SelectTrigger>
         <SelectContent>
          {catalogue.map((field) => (
           <SelectItem key={field.name} value={field.name}>{field.label}</SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Select
         value={rule.operator}
         onValueChange={(value) => patchRule(index, { operator: value as SegmentOperator })}
        >
         <SelectTrigger aria-label={`Rule ${index + 1} operator`}><SelectValue /></SelectTrigger>
         <SelectContent>
          {OPERATORS.map((operator) => (
           <SelectItem key={operator.value} value={operator.value}>{operator.label}</SelectItem>
          ))}
         </SelectContent>
        </Select>
        {options && rule.operator !== "in" ? (
         <Select value={rule.value} onValueChange={(value) => patchRule(index, { value })}>
          <SelectTrigger aria-label={`Rule ${index + 1} value`}><SelectValue placeholder="Pick a value" /></SelectTrigger>
          <SelectContent>
           {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
         </Select>
        ) : (
         <Input
          aria-label={`Rule ${index + 1} value`}
          value={rule.value}
          onChange={(event) => patchRule(index, { value: event.target.value })}
          placeholder={rule.operator === "in" ? "ACTIVE, FROZEN" : fieldType(rule.field) === "number" ? "30" : "Value"}
         />
        )}
        <Button
         type="button"
         variant="ghost"
         size="icon"
         aria-label={`Remove rule ${index + 1}`}
         onClick={() => setRules((current) => current.filter((_, i) => i !== index))}
        >
         <Trash2 className="size-4" aria-hidden="true" />
        </Button>
       </div>
      )
     })}
    </div>
   )}

   <DialogFooter>
    <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
    <Button type="submit" disabled={create.isPending || !name.trim() || rules.length === 0} aria-busy={create.isPending}>
     {create.isPending ? "Saving..." : "Save segment"}
    </Button>
   </DialogFooter>
  </form>
 )
}

function SegmentMembersDialog({ segmentId, segmentName, memberCount }: {
 segmentId: string
 segmentName: string
 memberCount: number
}) {
 const [open, setOpen] = React.useState(false)
 return (
  <>
   <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
    <Users className="mr-1 size-3.5" aria-hidden="true" />{memberCount}
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>{segmentName}</DialogTitle>
      <DialogDescription>Members this segment resolves to right now.</DialogDescription>
     </DialogHeader>
     {open ? <SegmentMembersBody segmentId={segmentId} /> : null}
    </DialogContent>
   </Dialog>
  </>
 )
}

function SegmentMembersBody({ segmentId }: { segmentId: string }) {
 const members = useSegmentMembers(segmentId, { limit: 100 })
 return (
  <DataState
   isLoading={members.isPending}
   isError={members.isError}
   onRetry={() => void members.refetch()}
   errorMessage="Could not load this segment's members."
   isEmpty={(members.data?.members ?? []).length === 0}
   emptyIcon={Users}
   emptyTitle="Nobody matches"
   emptyDescription="No member currently satisfies these rules."
  >
   <div className="grid max-h-[60vh] gap-1.5 overflow-y-auto pr-1">
    {(members.data?.members ?? []).map((member) => (
     <div key={member.memberId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
       <p className="truncate text-sm font-bold">{member.firstName} {member.lastName}</p>
       <p className="truncate text-xs text-muted-foreground">{member.email ?? "No email"}</p>
      </div>
      <div className="flex items-center gap-2">
       <Badge variant="outline">{member.status}</Badge>
       {member.riskLevel && (
        <Badge variant={member.riskLevel === "CRITICAL" || member.riskLevel === "HIGH" ? "destructive" : "secondary"}>
         {member.riskLevel}
        </Badge>
       )}
      </div>
     </div>
    ))}
   </div>
   {(members.data?.totalCount ?? 0) > (members.data?.members.length ?? 0) && (
    <p className="mt-2 text-xs text-muted-foreground">
     Showing the first {members.data?.members.length} of {members.data?.totalCount}.
    </p>
   )}
  </DataState>
 )
}

function SegmentRow({ row }: { row: SegmentSummary }) {
 const { hasPermission } = useAuth()
 const remove = useDeleteSegment()
 return (
  <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
   <div className="min-w-0">
    <div className="flex items-center gap-2">
     <p className="truncate text-sm font-bold">{row.segment.name}</p>
     {row.segment.isSystem && <Badge variant="secondary">Built in</Badge>}
    </div>
    <p className="truncate text-xs text-muted-foreground">
     {row.segment.description || `${row.segment.rules.length} rule${row.segment.rules.length === 1 ? "" : "s"}`}
    </p>
   </div>
   <div className="flex items-center gap-2">
    <SegmentMembersDialog
     segmentId={row.segment.id}
     segmentName={row.segment.name}
     memberCount={row.memberCount}
    />
    {/* A built-in segment cannot be edited or deleted -- the API answers
        403 -- so it is not offered one. */}
    {!row.segment.isSystem && hasPermission("members.update") && (
     <ConfirmAction
      label="Delete"
      title={`Delete "${row.segment.name}"?`}
      description="The saved rules go. No member is changed or removed."
      confirmLabel="Delete segment"
      pendingLabel="Deleting..."
      successMessage="Segment deleted"
      errorMessage="Could not delete this segment."
      onConfirm={() => remove.mutateAsync(row.segment.id)}
     />
    )}
   </div>
  </div>
 )
}

/**
 * Saved member segments.
 *
 * The rule engine, the field catalogue and six seeded system segments all
 * existed with nothing able to list them, let alone save one: the app had
 * no saved-search surface at all, so "everyone whose membership lapses
 * this month" had to be rebuilt by hand every time it was needed.
 */
export function SegmentsSection() {
 const { hasPermission } = useAuth()
 const canView = hasPermission("reports.view")
 const segments = useSegments(canView)

 if (!canView) return null

 return (
  <Panel
   title="Segments"
   titleId="member-segments"
   description="Saved rule sets over the member base, counted live."
   actions={hasPermission("members.update") ? <CreateSegmentDialog /> : undefined}
  >
   <DataState
    isLoading={segments.isPending}
    isError={segments.isError}
    onRetry={() => void segments.refetch()}
    errorMessage="Segments could not be loaded."
    isEmpty={(segments.data ?? []).length === 0}
    emptyIcon={Filter}
    emptyTitle="No segments yet"
    emptyDescription="Save a rule set to reuse it across campaigns and reports."
    skeletonRows={4}
   >
    <div className="grid gap-2">
     {(segments.data ?? []).map((row) => <SegmentRow key={row.segment.id} row={row} />)}
    </div>
   </DataState>
  </Panel>
 )
}
