"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { MemberPicker } from "@/components/shared/member-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useFoodItems,
  useCreateFoodItem,
  useDietPlans,
  useCreateDietPlan,
  useAssignDietPlan,
  useDietAssignments,
  useUpdateDietAssignmentStatus,
} from "@/lib/hooks/use-nutrition";
import { ApiError } from "@/lib/api/client";
import {
  createFoodItemSchema,
  createDietPlanSchema,
  assignDietPlanSchema,
  type CreateFoodItemInput,
  type CreateDietPlanInput,
  type AssignDietPlanInput,
} from "@/lib/validation/gym";
import type { DietAssignment, DietAssignmentStatus, MealSlot } from "@/lib/types/gym";

const MEAL_SLOTS: MealSlot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

function AddFoodItemDialog() {
  const [open, setOpen] = React.useState(false);
  const createFoodItem = useCreateFoodItem();

  const form = useForm<CreateFoodItemInput>({
    resolver: zodResolver(createFoodItemSchema),
    defaultValues: { name: "", servingSize: "", calories: undefined, proteinG: undefined, carbsG: undefined, fatG: undefined },
  });

  async function onSubmit(values: CreateFoodItemInput) {
    try {
      await createFoodItem.mutateAsync(values);
      toast.success("Food item added");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add food item");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add food item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New food item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Chicken Breast" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="servingSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serving size</FormLabel>
                  <FormControl>
                    <Input placeholder="100g" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calories</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proteinG"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carbsG"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carbs (g)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatG"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fat (g)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createFoodItem.isPending}>
                {createFoodItem.isPending ? "Adding..." : "Add food item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreateDietPlanDialog() {
  const [open, setOpen] = React.useState(false);
  const foodItemsQuery = useFoodItems();
  const createPlan = useCreateDietPlan();

  const form = useForm<CreateDietPlanInput>({
    resolver: zodResolver(createDietPlanSchema),
    defaultValues: { name: "", description: "", items: [], targetCalories: undefined },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  function addRow() {
    append({
      foodItemId: "",
      mealSlot: "BREAKFAST",
      quantity: 1,
      unit: "g",
    });
  }

  async function onSubmit(values: CreateDietPlanInput) {
    try {
      await createPlan.mutateAsync(values);
      toast.success("Diet plan created");
      setOpen(false);
      form.reset({ name: "", description: "", items: [], targetCalories: undefined });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create plan");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New diet plan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="High Protein Cut" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetCalories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target calories (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Food items</p>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-3.5" />
                Add food item
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add at least one food item to this plan.
              </p>
            )}

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.foodItemId`}
                      render={({ field: foodField }) => (
                        <FormItem className="flex-1">
                          <Select value={foodField.value} onValueChange={foodField.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a food item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {foodItemsQuery.data?.map((food) => (
                                <SelectItem key={food.id} value={food.id}>
                                  {food.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.mealSlot`}
                      render={({ field: mealField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Meal</FormLabel>
                          <Select value={mealField.value} onValueChange={mealField.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MEAL_SLOTS.map((slot) => (
                                <SelectItem key={slot} value={slot}>
                                  {slot}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...qtyField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unit`}
                      render={({ field: unitField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="g" {...unitField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? "Creating..." : "Create plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDietPlanDialog({ planId, planName }: { planId: string; planName: string }) {
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const assignPlan = useAssignDietPlan();

  const form = useForm<Omit<AssignDietPlanInput, "memberId">>({
    resolver: zodResolver(assignDietPlanSchema.omit({ memberId: true })),
    defaultValues: { notes: "" },
  });

  async function onSubmit(values: Omit<AssignDietPlanInput, "memberId">) {
    if (!member) {
      toast.error("Select a member first");
      return;
    }
    try {
      await assignPlan.mutateAsync({ planId, input: { ...values, memberId: member.id } });
      toast.success(`Assigned "${planName}" to ${member.label}`);
      setOpen(false);
      setMember(null);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to assign plan");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMember(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-3.5" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign &quot;{planName}&quot;</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Member</p>
            <MemberPicker value={member} onChange={setMember} />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={assignPlan.isPending}>
                  {assignPlan.isPending ? "Assigning..." : "Assign plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const assignmentStatusVariant: Record<DietAssignmentStatus, "default" | "success" | "secondary"> = {
  ACTIVE: "default",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

function AssignmentStatusCell({ assignment }: { assignment: DietAssignment }) {
  const { hasPermission } = useAuth();
  const updateStatus = useUpdateDietAssignmentStatus();

  if (assignment.status !== "ACTIVE" || !hasPermission("nutrition.assign")) {
    return (
      <Badge variant={assignmentStatusVariant[assignment.status]}>{assignment.status}</Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={assignmentStatusVariant[assignment.status]}>{assignment.status}</Badge>
      <Button
        variant="ghost"
        size="sm"
        disabled={updateStatus.isPending}
        onClick={() =>
          updateStatus
            .mutateAsync({ id: assignment.id, status: "COMPLETED" })
            .then(() => toast.success("Marked complete"))
            .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"))
        }
      >
        Mark complete
      </Button>
    </div>
  );
}

const assignmentColumns: ColumnDef<DietAssignment>[] = [
  {
    header: "Member",
    accessorKey: "member",
    cell: ({ row }) => {
      const m = row.original.member;
      return m ? `${m.firstName} ${m.lastName}` : "—";
    },
  },
  {
    header: "Plan",
    accessorKey: "dietPlan",
    cell: ({ row }) => row.original.dietPlan?.name ?? "—",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <AssignmentStatusCell assignment={row.original} />,
  },
  {
    header: "Assigned",
    accessorKey: "startDate",
    cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
  },
];

export default function NutritionPage() {
  const { hasPermission } = useAuth();
  const foodItemsQuery = useFoodItems();
  const plansQuery = useDietPlans({ pageSize: 50 });
  const [assignmentsPage, setAssignmentsPage] = React.useState(1);
  const assignmentsQuery = useDietAssignments({ page: assignmentsPage, pageSize: 10, order: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nutrition"
        description="Food library, diet plans, and assignments"
        actions={hasPermission("nutrition.create") && <CreateDietPlanDialog />}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Food library</CardTitle>
          {hasPermission("nutrition.create") && <AddFoodItemDialog />}
        </CardHeader>
        <CardContent>
          {!foodItemsQuery.data || foodItemsQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No food items yet. Add foods to start building diet plans.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {foodItemsQuery.data.map((food) => (
                <Badge key={food.id} variant="outline">
                  {food.name}
                  {food.calories != null && (
                    <span className="text-muted-foreground"> · {food.calories} kcal</span>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Plans</h2>
        {plansQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !plansQuery.data || plansQuery.data.items.length === 0 ? (
          <EmptyState
            title="No diet plans yet"
            description="Create a plan and assign it to a member to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plansQuery.data.items.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {plan.description && (
                    <p className="text-muted-foreground">{plan.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {plan.items.length} item{plan.items.length === 1 ? "" : "s"}
                    {plan.targetCalories != null && ` · ${plan.targetCalories} kcal target`}
                  </p>
                  {hasPermission("nutrition.assign") && (
                    <AssignDietPlanDialog planId={plan.id} planName={plan.name} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Assignments</h2>
        <DataTable
          columns={assignmentColumns}
          data={assignmentsQuery.data}
          isLoading={assignmentsQuery.isLoading}
          isError={assignmentsQuery.isError}
          onRetry={() => assignmentsQuery.refetch()}
          page={assignmentsPage}
          onPageChange={setAssignmentsPage}
          emptyTitle="No plans assigned yet"
        />
      </div>
    </div>
  );
}
