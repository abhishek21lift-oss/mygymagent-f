"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateExercise } from "@/lib/hooks/use-workouts";
import { ApiError } from "@/lib/api/client";
import {
  createExerciseSchema,
  type CreateExerciseInput,
} from "@/lib/validation/gym";

/**
 * The "new exercise" form, shared by the staff workouts page and the
 * trainer surface's exercise library.
 *
 * Extracted rather than written twice: both surfaces need the same
 * validation, the same mutation and the same success/failure handling, and
 * a second copy would be a second thing to forget to update when
 * `CreateExerciseDto` changes.
 *
 * `trigger` is a slot rather than a fixed button because the two callers
 * want genuinely different affordances -- the staff page uses an outline
 * "Add exercise" button inside a toolbar, while the trainer surface's
 * library header uses a white pill on a dark card. Rendering the same form
 * behind two triggers keeps one implementation without forcing one look.
 *
 * The dialog passes `onClick` only. It deliberately does not inject an
 * `aria-label`: doing so silently overrode each trigger's own accessible
 * name, so the staff button showed "Add exercise" but announced "New
 * exercise" -- a WCAG 2.5.3 Label in Name failure, and a button that
 * could no longer be found by the text a user can actually see.
 */
export function NewExerciseDialog({
  trigger,
  onCreated,
}: {
  trigger: (props: { onClick: () => void }) => React.ReactNode;
  /** Called after a successful create, so the caller can invalidate its
   *  list. The mutation already invalidates the shared `exercises` key;
   *  this is for callers holding derived state of their own. */
  onCreated?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const create = useCreateExercise();
  const form = useForm<CreateExerciseInput>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: { name: "", muscleGroup: "", equipment: "", description: "" },
  });

  async function submit(values: CreateExerciseInput) {
    try {
      await create.mutateAsync(values);
      toast.success("Exercise added");
      setOpen(false);
      form.reset();
      onCreated?.();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to add exercise",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger({ onClick: () => setOpen(true) })}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New exercise</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Back Squat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="muscleGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muscle group</FormLabel>
                    <FormControl>
                      <Input placeholder="Legs" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
                    <FormControl>
                      <Input placeholder="Barbell" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={create.isPending}
                className="min-h-11"
              >
                {create.isPending ? "Adding..." : "Add exercise"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** The staff page's outline-button trigger. */
export function OutlineAddExerciseTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="min-h-11 rounded-lg border-stone-200 bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Plus className="size-4" aria-hidden="true" />
      Add exercise
    </Button>
  );
}
