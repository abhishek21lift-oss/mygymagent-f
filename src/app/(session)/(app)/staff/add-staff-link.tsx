import Link from "next/link";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { accentVars } from "./staff-visuals";

/** Primary entry point to staff creation: the dedicated page. */
export function AddStaffLink() {
  return (
    <Button
      className="btn-sheen inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
      style={{
        ...accentVars("violet"),
        backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))",
        color: "var(--tone-on)",
      }}
      asChild
    >
      <Link href="/staff/new">
        <UserPlus className="size-4" aria-hidden="true" />
        Add staff
      </Link>
    </Button>
  );
}
