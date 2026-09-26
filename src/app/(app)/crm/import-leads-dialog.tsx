"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import { downloadTextFile, parseCsvToObjects } from "@/lib/csv"
import { useImportLeads, type ImportLeadRow } from "@/lib/hooks/use-leads"
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

/** The API caps an import at 500 rows and rejects the whole batch past
 * that, so the file is checked before it is sent rather than after. */
const MAX_ROWS = 500

const TEMPLATE = "firstName,lastName,phone,email,source,notes\n"

/** Header names are matched case-insensitively and without spaces, so a
 * sheet exported with "First Name" works without being re-typed. */
export function pick(row: Record<string, string>, key: string): string | undefined {
 const wanted = key.toLowerCase()
 for (const [header, value] of Object.entries(row)) {
  if (header.toLowerCase().replace(/[\s_]/g, "") === wanted) {
   return value.trim() || undefined
  }
 }
 return undefined
}

export function toLead(row: Record<string, string>): ImportLeadRow | null {
 const firstName = pick(row, "firstname")
 const lastName = pick(row, "lastname")
 if (!firstName || !lastName) return null
 return {
  firstName,
  lastName,
  phone: pick(row, "phone"),
  email: pick(row, "email"),
  source: pick(row, "source"),
  notes: pick(row, "notes"),
 }
}

function ImportBody({ onDone }: { onDone: () => void }) {
 const importLeads = useImportLeads()
 const [rows, setRows] = React.useState<Record<string, string>[]>([])
 const [fileName, setFileName] = React.useState<string | null>(null)

 const leads = rows.map(toLead)
 const valid = leads.filter((lead): lead is ImportLeadRow => lead !== null)
 const skipped = leads.length - valid.length
 const tooMany = valid.length > MAX_ROWS

 async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]
  if (!file) return
  const parsed = parseCsvToObjects(await file.text())
  setRows(parsed)
  setFileName(file.name)
  if (!parsed.length) toast.error("That file has no data rows under its header")
  // Allow re-picking the same file after a failed run.
  event.target.value = ""
 }

 async function run() {
  try {
   const result = await importLeads.mutateAsync(valid)
   toast.success(`${result.created ?? valid.length} leads imported`)
   onDone()
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "The import failed")
  }
 }

 return (
  <div className="grid gap-4">
   <div className="grid gap-2">
    <Label htmlFor="lead-csv">CSV file</Label>
    <Input id="lead-csv" type="file" accept=".csv,text/csv" onChange={(event) => void onFile(event)} />
    <p className="text-xs text-muted-foreground">
     firstName and lastName are required; phone, email, source and notes are optional.
    </p>
   </div>

   <Button
    type="button"
    variant="outline"
    size="sm"
    className="justify-self-start"
    onClick={() => downloadTextFile("leads-template.csv", TEMPLATE)}
   >
    Download a template
   </Button>

   {fileName && (
    <div className="rounded-lg border border-border p-3 text-sm">
     <p className="font-bold">{fileName}</p>
     <p className="text-muted-foreground tabular-nums">
      {valid.length} lead{valid.length === 1 ? "" : "s"} ready
      {skipped > 0 ? ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped for a missing name` : ""}
     </p>
     {tooMany && (
      <p role="alert" className="mt-1 font-semibold text-destructive">
       The API takes at most {MAX_ROWS} leads per import. Split the file and run it again.
      </p>
     )}
    </div>
   )}

   <DialogFooter>
    <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
    <Button
     type="button"
     disabled={valid.length === 0 || tooMany || importLeads.isPending}
     aria-busy={importLeads.isPending}
     onClick={() => void run()}
    >
     {importLeads.isPending ? "Importing..." : `Import ${valid.length || ""} lead${valid.length === 1 ? "" : "s"}`}
    </Button>
   </DialogFooter>
  </div>
 )
}

/**
 * Bulk lead import.
 *
 * POST /leads/import existed with nothing calling it, so a list from an
 * expo stand or a landing-page export had to be typed in one lead at a
 * time.
 */
export function ImportLeadsDialog() {
 const [open, setOpen] = React.useState(false)
 return (
  <>
   <Button type="button" variant="outline" className="min-h-11" onClick={() => setOpen(true)}>
    <Upload className="mr-2 size-4" aria-hidden="true" />Import CSV
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-lg">
     <DialogHeader>
      <DialogTitle>Import leads</DialogTitle>
      <DialogDescription>
       Add a list of enquiries at once. Every row becomes a new lead -- this does not
       match against people you already have.
      </DialogDescription>
     </DialogHeader>
     {open ? <ImportBody onDone={() => setOpen(false)} /> : null}
    </DialogContent>
   </Dialog>
  </>
 )
}
