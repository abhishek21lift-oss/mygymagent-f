"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/lib/hooks/use-branches";

export function BranchSelect({
  value,
  onChange,
  placeholder = "Select a branch",
  disabled,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const branchesQuery = useBranches({ pageSize: 100 });

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || branchesQuery.isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={branchesQuery.isLoading ? "Loading branches..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {branchesQuery.data?.items.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
