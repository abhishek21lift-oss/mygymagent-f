"use client";

import { Salad } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/panel";
import { usePortalNutrition } from "@/lib/hooks/use-portal";

/** `DietPlan.items` is a Json column, same caveat as the workout plan. */
type LooseItem = { name?: unknown; meal?: unknown; calories?: unknown; notes?: unknown };

const text = (v: unknown) =>
  typeof v === "string" || typeof v === "number" ? String(v) : null;

export default function PortalNutrition() {
  const diets = usePortalNutrition();
  const items = diets.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <DataState
        isLoading={diets.isPending}
        isError={diets.isError}
        onRetry={() => void diets.refetch()}
        errorMessage="Your nutrition plan could not be loaded."
        isEmpty={items.length === 0}
        emptyIcon={Salad}
        emptyTitle="No nutrition plan yet"
        emptyDescription="Your coach will assign one and it will appear here."
        skeletonRows={4}
      >
        {items.map((assignment) => {
          const meals: LooseItem[] = Array.isArray(assignment.dietPlan?.items)
            ? (assignment.dietPlan?.items as LooseItem[])
            : [];
          const target = assignment.dietPlan?.targetCalories;
          return (
            <Panel
              key={assignment.id}
              title={assignment.dietPlan?.name ?? "Nutrition plan"}
              titleId={`diet-${assignment.id}`}
              description={
                target
                  ? `Target ${target} kcal${
                      assignment.dietPlan?.targetProteinG
                        ? ` · ${assignment.dietPlan.targetProteinG}g protein`
                        : ""
                    }`
                  : (assignment.dietPlan?.description ?? undefined)
              }
              actions={
                <Badge
                  variant={assignment.status === "ACTIVE" ? "secondary" : "outline"}
                  className="rounded-full"
                >
                  {assignment.status}
                </Badge>
              }
              flush
            >
              {meals.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground sm:p-5">
                  This plan has no meals listed yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {meals.map((m, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {text(m.meal) ?? text(m.name) ?? `Meal ${i + 1}`}
                        </p>
                        {text(m.notes) && (
                          <p className="truncate text-xs text-muted-foreground">{text(m.notes)}</p>
                        )}
                      </div>
                      {text(m.calories) && (
                        <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                          {text(m.calories)} kcal
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </DataState>
    </div>
  );
}
