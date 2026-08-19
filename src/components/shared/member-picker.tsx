"use client";

import * as React from "react";
import { Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMembers } from "@/lib/hooks/use-members";

export function MemberPicker({
  value,
  onChange,
}: {
  value: { id: string; label: string } | null;
  onChange: (member: { id: string; label: string } | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const membersQuery = useMembers({ search: query || undefined, pageSize: 8 });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          <User className="size-4 text-muted-foreground" />
          {value ? value.label : "Search for a member..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="pl-7"
            placeholder="Name, email, or member code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {membersQuery.isLoading && (
            <p className="p-2 text-sm text-muted-foreground">Searching...</p>
          )}
          {!membersQuery.isLoading && membersQuery.data?.items.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">No members found.</p>
          )}
          {membersQuery.data?.items.map((member) => (
            <button
              key={member.id}
              type="button"
              className="flex flex-col items-start rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => {
                onChange({ id: member.id, label: `${member.firstName} ${member.lastName}` });
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium">
                {member.firstName} {member.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{member.memberCode}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
