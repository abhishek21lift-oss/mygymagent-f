"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAssignableTrainers, useUpdateMember } from "@/lib/hooks/use-members";
import { ApiError } from "@/lib/api/client";
import { editPayload } from "./edit-member-payload";

/**
 * The fields the edit form reads. The detail payload carries more (user,
 * memberships); the base member fewer (no screening/fitness extras) — both
 * satisfy this shape, and every access below tolerates null.
 */
export interface EditableMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  memberType: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship?: string | null;
  fitnessGoal?: string | null;
  injuries?: string | null;
  allergies?: string | null;
  medicalNotes?: string | null;
  notes: string | null;
  assignedTrainerId: string | null;
  primaryBranchId: string | null;
  assignedTrainer?: { id: string; firstName: string; lastName: string } | null;
}

const editMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),
  memberType: z.enum(["GYM", "PT", "GYM_PT"]).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  fitnessGoal: z.string().optional(),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  notes: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  primaryBranchId: z.string().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

/**
 * The member edit form, shared by the dedicated edit page. Same fields,
 * same validation and same PATCH payload as the dialog it replaces —
 * only the shell changed. Operational records (memberships, payments,
 * attendance, trainer programs, assessments, consents) stay read-only
 * elsewhere on the profile; nothing here touches them.
 */
export function EditMemberForm({
  member,
  cancelHref,
  onSaved,
}: {
  member: EditableMember;
  cancelHref: string;
  onSaved: () => void;
}) {
  const updateMember = useUpdateMember(member.id);
  const trainers = useAssignableTrainers(member.primaryBranchId ?? undefined);

  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email ?? "",
      phone: member.phone ?? "",
      dateOfBirth: member.dateOfBirth ?? "",
      gender: (member.gender as EditMemberFormData["gender"]) ?? undefined,
      memberType: (member.memberType as EditMemberFormData["memberType"]) ?? undefined,
      addressLine1: member.addressLine1 ?? "",
      addressLine2: member.addressLine2 ?? "",
      city: member.city ?? "",
      state: member.state ?? "",
      postalCode: member.postalCode ?? "",
      country: member.country ?? "",
      emergencyContactName: member.emergencyContactName ?? "",
      emergencyContactPhone: member.emergencyContactPhone ?? "",
      emergencyContactRelationship: member.emergencyContactRelationship ?? "",
      fitnessGoal: member.fitnessGoal ?? "",
      injuries: member.injuries ?? "",
      allergies: member.allergies ?? "",
      medicalNotes: member.medicalNotes ?? "",
      notes: member.notes ?? "",
      assignedTrainerId: member.assignedTrainerId ?? "",
      primaryBranchId: member.primaryBranchId ?? "",
    },
  });

  async function onSubmit(values: EditMemberFormData) {
    try {
      await updateMember.mutateAsync(editPayload(values, form.formState.defaultValues ?? {}));
      toast.success("Member updated successfully");
      onSaved();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update member");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-5 rounded-lg border border-violet-100/70 bg-muted/40 p-1.5">
            <TabsTrigger value="personal" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Personal</TabsTrigger>
            <TabsTrigger value="address" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Address</TabsTrigger>
            <TabsTrigger value="emergency" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Emergency</TabsTrigger>
            <TabsTrigger value="fitness" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Fitness</TabsTrigger>
            <TabsTrigger value="assignment" className="min-h-11 rounded-xl font-bold data-[state=active]: data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Assignment</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="UNDISCLOSED">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="memberType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Type</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GYM">Gym</SelectItem>
                      <SelectItem value="PT">Personal Training</SelectItem>
                      <SelectItem value="GYM_PT">Gym + PT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="address" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactRelationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="fitness" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="fitnessGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fitness Goal</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="injuries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Injuries</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="medicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="assignment" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="assignedTrainerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange} disabled={trainers.isLoading}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={trainers.isLoading ? "Loading trainers…" : "No coach"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {member.assignedTrainer && !trainers.data?.some((t) => t.id === member.assignedTrainer?.id) ? (
                        <SelectItem value={member.assignedTrainer.id}>
                          {member.assignedTrainer.firstName} {member.assignedTrainer.lastName}
                        </SelectItem>
                      ) : null}
                      {(trainers.data ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>To remove a coach, use Change PT under Actions.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryBranchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Branch ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="min-h-11" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="min-h-11 sm:w-auto"
            disabled={updateMember.isPending}
          >
            {updateMember.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
