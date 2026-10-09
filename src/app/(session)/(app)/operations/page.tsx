"use client";

import * as React from "react";

import { useBranches } from "@/lib/hooks/use-branches";
import {
  useClassCapacity,
  useOperationsHealth,
  useSchedulingConflicts,
} from "@/lib/hooks/use-analytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CapacityBoard,
  ConflictsList,
  OperationsHealthPanels,
  OperationsHero,
} from "./operations-sections";

const ALL_BRANCHES = "all";

export default function OperationsPage() {
  const [selectedBranch, setSelectedBranch] = React.useState<string>(ALL_BRANCHES);
  const branches = useBranches({ pageSize: 100 });
  const branchItems = branches.data?.items ?? [];
  const branchFilter = selectedBranch !== ALL_BRANCHES ? selectedBranch : undefined;

  const health = useOperationsHealth(branchFilter);
  const capacity = useClassCapacity(branchFilter);
  const conflicts = useSchedulingConflicts(branchFilter);

  return (
    <div className="flex w-full flex-col gap-6 pb-8">
      <OperationsHero
        health={health.data}
        isLoading={health.isLoading}
        isError={health.isError}
        onRetry={() => void health.refetch()}
      />

      {branchItems.length > 1 && (
        <div className="-mt-4 flex flex-wrap items-center gap-2">
          <Select value={branchFilter ?? ALL_BRANCHES} onValueChange={setSelectedBranch}>
            <SelectTrigger aria-label="Branch" className="h-8 w-auto min-w-40 rounded-xl bg-card text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
              {branchItems.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <OperationsHealthPanels
        health={health.data}
        isLoading={health.isLoading}
        isError={health.isError}
        onRetry={() => void health.refetch()}
      />

      <ConflictsList
        conflicts={conflicts.data}
        isLoading={conflicts.isLoading}
        isError={conflicts.isError}
        onRetry={() => void conflicts.refetch()}
      />

      <CapacityBoard
        capacity={capacity.data}
        isLoading={capacity.isLoading}
        isError={capacity.isError}
        onRetry={() => void capacity.refetch()}
      />
    </div>
  );
}
