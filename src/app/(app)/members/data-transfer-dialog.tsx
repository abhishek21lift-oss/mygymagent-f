"use client";

import * as React from "react";
import { Download, FileUp, Loader2, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { downloadTextFile, parseCsvToObjects } from "@/lib/csv";
import {
  useExportMembers,
  useImportCustomerEnquiry,
  useImportMembers,
  useMemberTemplate,
  type CustomerEnquiryImportReport,
  type MemberImportResult,
} from "@/lib/hooks/use-data-transfer";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** The warning lists are long; naming a few is more use than a count alone. */
function WarningLine({ label, rows }: { label: string; rows: string[] }) {
  if (!rows.length) return null;
  return (
    <li>
      <span className="font-medium">{rows.length}</span> {label}
      <span className="text-muted-foreground">
        {" — "}
        {rows.slice(0, 4).join(", ")}
        {rows.length > 4 ? ` and ${rows.length - 4} more` : ""}
      </span>
    </li>
  );
}

/**
 * Moving members in and out as a file.
 *
 * `/data/*` had four endpoints and no screen, so the only way to run an
 * import was a token and a terminal -- which is exactly how this
 * deployment's own 1342-row enquiry file was loaded. The work was done;
 * the door was missing.
 *
 * It opens from the member directory rather than from Settings because
 * that is where someone stands when they think "I have a spreadsheet of
 * these people". Export and the blank template are `data.export`, the two
 * importers are `data.import`, and each tab is offered only to a reader
 * who holds the grant behind it.
 *
 * The enquiry importer previews before it commits. That is not politeness:
 * it classifies each row as a member or a lead, matches trainers by name
 * and reports what it could not read, and a run that silently creates 900
 * people is not something to find out about afterwards. Same preview-then-
 * confirm shape as the bulk membership assignment on this page.
 */
export function DataTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {/* Mounted only while open. A previous run's report must never be
            read as this one's, and the obvious fix -- an effect that
            clears the state on open -- is a synchronous setState inside an
            effect, which the React Compiler rejects for cascading renders.
            Letting unmount do it needs no effect at all. */}
        {open && <DataTransferBody onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function DataTransferBody({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { hasPermission } = useAuth();
  const canExport = hasPermission("data.export");
  const canImport = hasPermission("data.import");

  const exportMembers = useExportMembers();
  const template = useMemberTemplate();
  const importMembers = useImportMembers();
  const enquiry = useImportCustomerEnquiry();

  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<MemberImportResult | null>(null);
  const [preview, setPreview] = React.useState<CustomerEnquiryImportReport | null>(null);
  const [mode, setMode] = React.useState<"members" | "enquiry">("members");

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsvToObjects(text);
    setRows(parsed);
    setFileName(file.name);
    setResult(null);
    setPreview(null);
    if (!parsed.length) toast.error("That file has no data rows under its header");
    // Allow re-picking the same file after a failed run.
    event.target.value = "";
  }

  async function download(kind: "export" | "template") {
    const mutation = kind === "export" ? exportMembers : template;
    try {
      const csv = await mutation.mutateAsync();
      downloadTextFile(kind === "export" ? "members.csv" : "members-template.csv", csv);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "The download could not be prepared",
      );
    }
  }

  async function runMemberImport() {
    try {
      const res = await importMembers.mutateAsync(rows);
      setResult(res);
      toast.success(`${res.created} created, ${res.skipped} skipped`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The import failed");
    }
  }

  async function runEnquiry(dryRun: boolean) {
    try {
      const report = await enquiry.mutateAsync({ rows, dryRun });
      setPreview(report);
      if (!dryRun) {
        toast.success(
          `${report.members.created} members and ${report.leads.created} leads created`,
        );
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The import failed");
    }
  }

  const busy =
    importMembers.isPending || enquiry.isPending || exportMembers.isPending || template.isPending;

  return (
    <>
        <DialogHeader>
          <DialogTitle>Import and export members</DialogTitle>
          <DialogDescription>
            Move people in and out as a CSV. Imports match on phone and email, so
            re-running a file updates rather than duplicates.
          </DialogDescription>
        </DialogHeader>

        {canExport && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void download("export")}
              disabled={exportMembers.isPending}
            >
              {exportMembers.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              Export all members
            </Button>
            <Button
              variant="outline"
              onClick={() => void download("template")}
              disabled={template.isPending}
            >
              <FileUp className="size-4" aria-hidden="true" />
              Blank template
            </Button>
          </div>
        )}

        {canImport && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="members" className="flex-1">
                Member CSV
              </TabsTrigger>
              <TabsTrigger value="enquiry" className="flex-1">
                Customer enquiry export
              </TabsTrigger>
            </TabsList>

            <div className="mt-3 flex flex-col gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:bg-accent">
                <Upload className="size-4" aria-hidden="true" />
                {fileName ? `${fileName} — ${rows.length} rows` : "Choose a CSV file"}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => void onFile(e)}
                />
              </label>

              <TabsContent value="members" className="m-0">
                <Button
                  onClick={() => void runMemberImport()}
                  disabled={!rows.length || importMembers.isPending}
                >
                  {importMembers.isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  Import {rows.length || ""} member{rows.length === 1 ? "" : "s"}
                </Button>

                {result && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <Stat label="Created" value={result.created} />
                      <Stat label="Skipped" value={result.skipped} />
                      <Stat label="Errors" value={result.errors.length} />
                    </div>
                    {result.errors.length > 0 && (
                      <ul className="max-h-40 overflow-y-auto rounded-lg border border-border p-3 text-xs">
                        {result.errors.slice(0, 50).map((e) => (
                          <li key={`${e.row}-${e.message}`}>
                            <span className="font-medium">Row {e.row}</span>: {e.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="enquiry" className="m-0">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void runEnquiry(true)}
                    disabled={!rows.length || enquiry.isPending}
                  >
                    {enquiry.isPending && (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    Preview
                  </Button>
                  <Button
                    onClick={() => void runEnquiry(false)}
                    disabled={!preview || !preview.dryRun || enquiry.isPending}
                  >
                    Import for real
                  </Button>
                </div>
                {!preview && rows.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Preview first — it reports what would be created without writing
                    anything.
                  </p>
                )}

                {preview && (
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={preview.dryRun ? "secondary" : "success"}>
                        {preview.dryRun ? "Preview — nothing written" : "Imported"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {preview.sourceRows} source rows
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Stat
                        label="Members"
                        value={preview.dryRun ? preview.members.toCreate : preview.members.created}
                      />
                      <Stat
                        label="Leads"
                        value={preview.dryRun ? preview.leads.toCreate : preview.leads.created}
                      />
                      <Stat label="Already present" value={preview.members.alreadyPresent} />
                      <Stat label="Ambiguous" value={preview.classified.ambiguous} />
                    </div>
                    <ul className="flex flex-col gap-1 rounded-lg border border-border p-3 text-xs">
                      <WarningLine label="with no readable join date" rows={preview.warnings.unparseableJoinDate} />
                      <WarningLine label="with no readable date of birth" rows={preview.warnings.unparseableDateOfBirth} />
                      <WarningLine label="missing a phone number" rows={preview.warnings.missingPhone} />
                      <WarningLine label="whose phone disagrees with an existing record" rows={preview.warnings.phoneDisagreement} />
                      <WarningLine label="with a single-word name" rows={preview.warnings.singleWordName} />
                      <WarningLine label="named as a trainer but not matched" rows={preview.trainers.unmatched} />
                      {preview.warnings.activeWithoutMembership > 0 && (
                        <li className="flex items-start gap-1.5">
                          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
                          <span>
                            <span className="font-medium">
                              {preview.warnings.activeWithoutMembership}
                            </span>{" "}
                            are marked active but carry no plan, price or end date, so no
                            membership is created for them.
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}

        {!canExport && !canImport && (
          <p className="text-sm text-muted-foreground">
            You do not have permission to import or export member data.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
        </DialogFooter>
    </>
  );
}
