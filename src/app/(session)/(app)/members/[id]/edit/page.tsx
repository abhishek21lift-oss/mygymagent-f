"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useMember } from "@/lib/hooks/use-members";
import { initials } from "../member-profile-stats";
import { EditMemberForm } from "../edit-member-form";
import { ProfilePhotoSection } from "./profile-photo-section";

export default function EditMemberPage() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const router = useRouter();
  const { hasPermission } = useAuth();
  const memberQuery = useMember(id);

  const canEdit = hasPermission("members.update");

  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero
        id="edit-member-title"
        icon={Pencil}
        title="Edit member"
        actions={
          id ? (
            <Link
              href={`/members/${id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Profile
            </Link>
          ) : null
        }
      />
      {!id || !canEdit ? (
        <EmptyState
          title={!id ? "Member not found" : "Not permitted"}
          description={
            !id
              ? "That profile link is incomplete."
              : "Your account cannot edit members. Ask the gym owner for access."
          }
        />
      ) : memberQuery.isLoading ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4" role="status" aria-label="Loading member">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : memberQuery.isError || !memberQuery.data ? (
        <div className="mx-auto w-full max-w-2xl">
          <ErrorState onRetry={() => void memberQuery.refetch()} />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <ProfilePhotoSection
            memberId={memberQuery.data.id}
            initials={initials(memberQuery.data.firstName, memberQuery.data.lastName)}
          />
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <EditMemberForm
              member={memberQuery.data}
              cancelHref={`/members/${memberQuery.data.id}`}
              onSaved={() => router.push(`/members/${memberQuery.data.id}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
