"use client";

import { ExternalLink, FileText } from "lucide-react";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { usePortalDocuments, type PortalDocument } from "@/lib/hooks/use-portal";

const CATEGORY: Record<PortalDocument["category"], string> = {
  DOCUMENT: "Document",
  PROGRESS_PHOTO: "Progress photo",
  ID_SCAN: "ID",
  OTHER: "Other",
};

const STATUS: Record<
  PortalDocument["status"],
  { label: string; variant: "secondary" | "outline" | "destructive" | "default" }
> = {
  DRAFT: { label: "Uploaded", variant: "outline" },
  SUBMITTED: { label: "Being reviewed", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Needs redoing", variant: "destructive" },
};

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * What the gym holds on file for the member. Read-only: uploads and
 * reviews stay with staff, who are the ones answerable for an ID scan
 * being the right person's.
 */
export default function PortalDocuments() {
  const documents = usePortalDocuments();
  const items = documents.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHero icon={FileText} title="Documents" description="What the gym has on file for you" />
      <Panel title="Your documents" titleId="portal-documents" flush>
        <div className="p-4 sm:p-5">
          <DataState
            isLoading={documents.isPending}
            isError={documents.isError}
            onRetry={() => void documents.refetch()}
            errorMessage="Your documents could not be loaded."
            isEmpty={items.length === 0}
            emptyIcon={FileText}
            emptyTitle="No documents on file"
            emptyDescription="Anything the gym keeps for you — forms, waivers, progress photos — will show up here."
            skeletonRows={3}
          >
            <ul className="divide-y divide-border">
              {items.map((doc) => {
                const status = STATUS[doc.status];
                return (
                  <li key={doc.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 max-w-full items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
                        >
                          <span className="min-w-0 [overflow-wrap:anywhere]">{doc.originalName}</span>
                          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORY[doc.category]} · {size(doc.sizeBytes)} ·{" "}
                          {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.currentVersion > 1 && <> · version {doc.currentVersion}</>}
                        </p>
                        {doc.description && (
                          <p className="mt-1 text-xs">{doc.description}</p>
                        )}
                      </div>
                      <Badge variant={status.variant} className="shrink-0 rounded-full">
                        {status.label}
                      </Badge>
                    </div>
                    {doc.status === "REJECTED" && doc.rejectionReason && (
                      <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs">
                        {doc.rejectionReason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </DataState>
        </div>
      </Panel>
    </div>
  );
}
