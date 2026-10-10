"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { useAuth } from "@/lib/auth/auth-context";
import { AddStaffForm } from "../add-staff-form";

export default function NewStaffPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  if (!hasPermission("users.create")) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <PageHero id="new-staff-title" icon={UserPlus} title="Add staff" />
        <EmptyState
          title="Not permitted"
          description="Your account cannot add staff members. Ask the gym owner for access."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero
        id="new-staff-title"
        icon={UserPlus}
        title="Add staff"
        actions={
          <Link
            href="/staff"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Staff
          </Link>
        }
      />
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-4 text-sm text-muted-foreground">
          Profile, role, app access and pay in five short steps. Nothing is saved until the final step.
        </p>
        {/* Success lands back on the list, which refetches on the same
            staff-query invalidation the creation mutation already does. */}
        <AddStaffForm onDone={() => router.push("/staff")} />
      </div>
    </div>
  );
}
