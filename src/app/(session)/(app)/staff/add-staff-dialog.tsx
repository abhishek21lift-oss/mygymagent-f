"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Sparkles,
  UserPlus,
  UserRoundX,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { getCurrentBranchId } from "@/lib/branch-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranches } from "@/lib/hooks/use-branches";
import { useAddStaff, useAssignableRoles } from "@/lib/hooks/use-staff";
import type { Accent } from "@/lib/section-accent";
import type { StaffUser } from "@/lib/types/gym";
import { cn, displayCurrencyAmount } from "@/lib/utils";
import { addStaffSchema, toAddStaffPayload, type AddStaffValues } from "@/lib/validation/gym";
import { StaffAvatar, accentVars, roleLook } from "./staff-visuals";

type StepId = "profile" | "role" | "access" | "pay" | "review";

const STEPS: { id: StepId; label: string; accent: Accent; fields: FieldPath<AddStaffValues>[] }[] = [
  { id: "profile", label: "Profile", accent: "violet", fields: ["firstName", "lastName", "phone", "jobTitle", "specializations"] },
  { id: "role", label: "Role", accent: "blue", fields: ["roleKey", "primaryBranchId"] },
  { id: "access", label: "Access", accent: "emerald", fields: ["access", "email", "password"] },
  { id: "pay", label: "Pay", accent: "amber", fields: ["salaryType", "salaryAmount", "employeeCode", "hireDate"] },
  { id: "review", label: "Review", accent: "rose", fields: [] },
];

/** Ownership is handed over from Manage roles, where only an owner can. */
const HIDDEN_ROLES = new Set(["ORG_OWNER", "MEMBER", "PLATFORM_OWNER", "PLATFORM_ADMIN"]);

const ACCESS_OPTIONS: {
  value: AddStaffValues["access"];
  title: string;
  body: string;
  icon: LucideIcon;
  accent: Accent;
}[] = [
  {
    value: "INVITE",
    title: "Email an invite",
    body: "They get a link and choose their own password.",
    icon: Mail,
    accent: "blue",
  },
  {
    value: "PASSWORD",
    title: "Set a password now",
    body: "They can sign in straight away. You share the login.",
    icon: KeyRound,
    accent: "violet",
  },
  {
    value: "NONE",
    title: "No app access",
    body: "On the team for payroll and attendance, without a login.",
    icon: UserRoundX,
    accent: "amber",
  },
];

const SALARY_OPTIONS: { value: AddStaffValues["salaryType"]; label: string; unit: string }[] = [
  { value: "MONTHLY", label: "Monthly", unit: "per month" },
  { value: "DAILY", label: "Daily", unit: "per day" },
  { value: "HOURLY", label: "Hourly", unit: "per hour" },
  { value: "NONE", label: "Later", unit: "" },
];

const SPECIALITY_SUGGESTIONS = ["Strength", "Weight loss", "CrossFit", "Yoga", "Zumba", "Powerlifting", "Rehab", "Calisthenics"];

const DEFAULTS: AddStaffValues = {
  firstName: "",
  lastName: "",
  phone: "",
  jobTitle: "",
  isTrainer: false,
  specializations: [],
  primaryBranchId: "",
  roleKey: "",
  allBranches: true,
  access: "INVITE",
  email: "",
  password: "",
  salaryType: "NONE",
  salaryAmount: "",
  employeeCode: "",
  hireDate: "",
};

/** 14 characters from an alphabet without look-alikes (no 0/O, 1/l/I),
 * since it will be read out or typed from a message. */
export function generatePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => alphabet[v % alphabet.length]).join("");
}

function Choice({
  selected,
  accent,
  onSelect,
  children,
  className,
  label,
}: {
  selected: boolean;
  accent: Accent;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      style={accentVars(accent)}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-2xl border bg-card p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none",
        selected
          ? "border-transparent shadow-md ring-2 ring-[var(--tone)] [background:linear-gradient(135deg,var(--tone-wash),var(--card))]"
          : "border-border/80",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full transition",
          selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
        style={{ backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))", color: "var(--tone-on)" }}
      >
        <Check className="size-3" />
      </span>
    </button>
  );
}

function ToneIcon({ icon: Icon, accent, size = "md" }: { icon: LucideIcon; accent: Accent; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...accentVars(accent),
        backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))",
        color: "var(--tone-on)",
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl shadow-sm",
        size === "md" ? "size-10" : "size-12 rounded-2xl",
      )}
    >
      <Icon className={size === "md" ? "size-5" : "size-6"} />
    </span>
  );
}

function StepRail({ steps, current }: { steps: typeof STEPS; current: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Steps">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.id} className="flex flex-1 flex-col gap-1.5" aria-current={active ? "step" : undefined}>
            <span
              style={accentVars(step.accent)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none",
                done || active ? "[background-image:linear-gradient(90deg,var(--tone-grad-1),var(--tone-grad-2))]" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "hidden text-[11px] font-semibold sm:block",
                active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/60",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-9 rounded-full"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          toast.error("Could not copy. Select and copy it instead.");
        }
      }}
    >
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Success({
  staff,
  values,
  onAddAnother,
  onDone,
}: {
  staff: StaffUser;
  values: AddStaffValues;
  onAddAnother: () => void;
  onDone: () => void;
}) {
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const details = `Your THE CULT CLIENT login\n${loginUrl}\nEmail: ${values.email}\nPassword: ${values.password}`;
  return (
    <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-8 text-center">
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-0 -m-3 animate-ping rounded-full opacity-20 motion-reduce:hidden"
          style={{ ...accentVars("emerald"), background: "var(--tone)" }}
        />
        <StaffAvatar firstName={staff.firstName} lastName={staff.lastName} seed={staff.id} size="lg" />
        <span
          className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full ring-4 ring-background"
          style={{ ...accentVars("emerald"), backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))", color: "var(--tone-on)" }}
        >
          <Check className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div>
        <DialogTitle className="text-xl font-bold tracking-tight">
          {staff.firstName} is on the team
        </DialogTitle>
        <DialogDescription className="mt-1">
          {values.access === "INVITE" && <>We emailed <strong className="text-foreground">{values.email}</strong> a link to set their password. It works for 7 days.</>}
          {values.access === "PASSWORD" && <>They can sign in now. Share these details with them privately.</>}
          {values.access === "NONE" && <>They are on the roster without a login. You can give them app access any time from the staff list.</>}
        </DialogDescription>
      </div>

      {values.access === "PASSWORD" && (
        <div className="w-full rounded-2xl border bg-muted/40 p-4 text-left">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-medium">{values.email}</dd>
            <dt className="text-muted-foreground">Password</dt>
            <dd className="font-mono font-semibold tracking-wide">{values.password}</dd>
          </dl>
          <div className="mt-3 flex justify-end">
            <CopyButton text={details} label="Copy login details" />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={onAddAnother}>
          <UserPlus className="size-4" aria-hidden="true" /> Add another
        </Button>
        <Button type="button" className="min-h-11 rounded-full px-6" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function AddStaffDialog() {
  const { hasPermission } = useAuth();
  const canSetPay = hasPermission("hr.manage");
  const [open, setOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [showPassword, setShowPassword] = React.useState(false);
  const [specialityDraft, setSpecialityDraft] = React.useState("");
  const [created, setCreated] = React.useState<{ staff: StaffUser; values: AddStaffValues } | null>(null);

  const roles = useAssignableRoles(open);
  const branches = useBranches({ pageSize: 100 });
  const addStaff = useAddStaff();

  const steps = React.useMemo(() => STEPS.filter((s) => s.id !== "pay" || canSetPay), [canSetPay]);
  const step = steps[stepIndex];

  const form = useForm<AddStaffValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control }) as AddStaffValues;

  const branchList = React.useMemo(() => branches.data?.items ?? [], [branches.data]);
  const roleList = (roles.data ?? []).filter((r) => !HIDDEN_ROLES.has(r.key));

  // Start on the branch being worked in (or the only one), so the
  // common case is no choice at all.
  React.useEffect(() => {
    if (!open || !branchList.length || form.getValues("primaryBranchId")) return;
    const current = getCurrentBranchId();
    const preferred = branchList.find((b) => b.id === current) ?? branchList[0];
    form.setValue("primaryBranchId", preferred.id);
  }, [open, branchList, form]);

  function reset() {
    form.reset(DEFAULTS);
    setStepIndex(0);
    setCreated(null);
    setShowPassword(false);
    setSpecialityDraft("");
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) window.setTimeout(reset, 200);
  }

  async function next() {
    const ok = await form.trigger(step.fields);
    if (ok) setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function selectRole(key: string) {
    form.setValue("roleKey", key, { shouldValidate: true });
    // A trainer role almost always means a trainer; keep the switch in step.
    if (key === "TRAINER" || key === "HEAD_TRAINER") form.setValue("isTrainer", true);
    if (key === "ORG_ADMIN") form.setValue("allBranches", true);
  }

  function selectAccess(access: AddStaffValues["access"]) {
    form.setValue("access", access);
    if (access === "PASSWORD" && !form.getValues("password")) {
      form.setValue("password", generatePassword());
      setShowPassword(true);
    }
    form.clearErrors(["email", "password"]);
  }

  function addSpeciality(raw: string) {
    const value = raw.trim();
    const current = form.getValues("specializations");
    if (!value || current.length >= 12) return;
    if (current.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    form.setValue("specializations", [...current, value]);
    setSpecialityDraft("");
  }

  async function submit(formValues: AddStaffValues) {
    try {
      const staff = await addStaff.mutateAsync(toAddStaffPayload(formValues, canSetPay));
      setCreated({ staff, values: formValues });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not add this staff member.";
      toast.error(message);
      if (error instanceof ApiError && /email/i.test(message)) {
        setStepIndex(steps.findIndex((s) => s.id === "access"));
        form.setError("email", { message });
      }
    }
  }

  const selectedRole = roleList.find((r) => r.key === values.roleKey);
  const selectedBranch = branchList.find((b) => b.id === values.primaryBranchId);
  const fullName = `${values.firstName ?? ""} ${values.lastName ?? ""}`.trim();
  const salaryUnit = SALARY_OPTIONS.find((o) => o.value === values.salaryType)?.unit;
  const isLast = stepIndex === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="btn-sheen inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none"
          style={{
            ...accentVars("violet"),
            backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))",
            color: "var(--tone-on)",
          }}
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Add staff
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92dvh] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl"
      >
        {created ? (
          <Success
            staff={created.staff}
            values={created.values}
            onAddAnother={reset}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="flex max-h-[92dvh] flex-col">
              {/* Masthead: the step's hue as light, the person taking shape. */}
              <div
                style={accentVars(step.accent)}
                className="relative shrink-0 overflow-hidden border-b px-5 pb-4 pt-5 transition-colors duration-500 sm:px-6"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-0 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(28rem 10rem at 0% 0%, color-mix(in oklab, var(--tone-grad-1) 18%, transparent), transparent 70%), radial-gradient(22rem 9rem at 100% 0%, color-mix(in oklab, var(--tone-grad-2) 12%, transparent), transparent 70%)",
                  }}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <StaffAvatar
                      firstName={values.firstName || "N"}
                      lastName={values.lastName || "S"}
                      seed={fullName || "new"}
                      size="md"
                    />
                    <div className="min-w-0">
                      <DialogTitle className="truncate text-lg font-bold tracking-tight">
                        {fullName || "Add a staff member"}
                      </DialogTitle>
                      <DialogDescription className="truncate text-xs">
                        {selectedRole ? `${selectedRole.name}${selectedBranch ? ` · ${selectedBranch.name}` : ""}` : "A few details and they are on the team"}
                      </DialogDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <X className="size-4" aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                <div className="relative mt-4">
                  <StepRail steps={steps} current={stepIndex} />
                </div>
              </div>

              <div
                key={step.id}
                className="min-h-0 flex-1 overflow-y-auto px-5 py-5 animate-in fade-in-0 slide-in-from-right-3 duration-300 motion-reduce:animate-none sm:px-6"
              >
                {step.id === "profile" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input autoFocus autoComplete="off" className="h-11 rounded-xl" {...field} />
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
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                              <Input autoComplete="off" className="h-11 rounded-xl" {...field} />
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
                            <FormLabel>Phone <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                              <Input type="tel" inputMode="tel" placeholder="98765 43210" className="h-11 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job title <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Floor trainer, Manager..." className="h-11 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isTrainer"
                      render={({ field }) => (
                        <FormItem
                          style={accentVars("emerald")}
                          className={cn(
                            "flex flex-row items-center justify-between gap-3 rounded-2xl border p-4 transition",
                            field.value && "border-transparent ring-2 ring-[var(--tone)] [background:linear-gradient(135deg,var(--tone-wash),var(--card))]",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <ToneIcon icon={Sparkles} accent="emerald" />
                            <div>
                              <FormLabel className="mb-0 text-sm font-semibold">Trains members</FormLabel>
                              <p className="text-xs text-muted-foreground">Shows up for PT sessions, classes and member assignment.</p>
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Trains members" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {values.isTrainer && (
                      <div className="flex flex-col gap-2 animate-in fade-in-0 duration-300 motion-reduce:animate-none">
                        <p className="text-sm font-medium">Specialities <span className="font-normal text-muted-foreground">(optional)</span></p>
                        <div className="flex flex-wrap gap-1.5">
                          {SPECIALITY_SUGGESTIONS.map((s) => {
                            const on = values.specializations?.some((v) => v.toLowerCase() === s.toLowerCase());
                            return (
                              <button
                                key={s}
                                type="button"
                                aria-pressed={on}
                                style={accentVars("emerald")}
                                onClick={() =>
                                  on
                                    ? form.setValue("specializations", values.specializations.filter((v) => v.toLowerCase() !== s.toLowerCase()))
                                    : addSpeciality(s)
                                }
                                className={cn(
                                  "min-h-9 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-ring",
                                  on ? "border-transparent bg-[var(--tone-tint)] text-[var(--tone-ink)]" : "hover:bg-muted",
                                )}
                              >
                                {on && <Check className="mr-1 inline size-3" aria-hidden="true" />}
                                {s}
                              </button>
                            );
                          })}
                          {values.specializations
                            ?.filter((v) => !SPECIALITY_SUGGESTIONS.some((s) => s.toLowerCase() === v.toLowerCase()))
                            .map((v) => (
                              <button
                                key={v}
                                type="button"
                                style={accentVars("emerald")}
                                onClick={() => form.setValue("specializations", values.specializations.filter((x) => x !== v))}
                                className="min-h-9 rounded-full bg-[var(--tone-tint)] px-3 text-xs font-semibold text-[var(--tone-ink)]"
                              >
                                {v} <X className="ml-1 inline size-3" aria-hidden="true" />
                                <span className="sr-only">Remove</span>
                              </button>
                            ))}
                        </div>
                        <Input
                          value={specialityDraft}
                          onChange={(e) => setSpecialityDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addSpeciality(specialityDraft);
                            }
                          }}
                          onBlur={() => addSpeciality(specialityDraft)}
                          placeholder="Add your own and press Enter"
                          className="h-10 rounded-xl"
                          maxLength={40}
                          aria-label="Add a speciality"
                        />
                      </div>
                    )}
                  </div>
                )}

                {step.id === "role" && (
                  <div className="flex flex-col gap-5">
                    <FormField
                      control={form.control}
                      name="roleKey"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">What will they do?</FormLabel>
                          {roles.isLoading ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-muted" />
                              ))}
                            </div>
                          ) : roles.isError ? (
                            <div className="flex items-center justify-between rounded-2xl border border-destructive/30 p-3 text-sm">
                              Could not load roles.
                              <Button type="button" size="sm" variant="outline" onClick={() => roles.refetch()}>
                                <RefreshCw className="size-3.5" aria-hidden="true" /> Retry
                              </Button>
                            </div>
                          ) : (
                            <div role="radiogroup" aria-label="Role" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {roleList.map((role) => {
                                const look = roleLook(role.key);
                                return (
                                  <Choice
                                    key={role.key}
                                    accent={look.accent}
                                    selected={values.roleKey === role.key}
                                    onSelect={() => selectRole(role.key)}
                                    label={role.name}
                                  >
                                    <ToneIcon icon={look.icon} accent={look.accent} />
                                    <span className="min-w-0 pr-5">
                                      <span className="block truncate text-sm font-semibold">{role.name}</span>
                                      <span className="line-clamp-2 text-xs text-muted-foreground">
                                        {role.isOrganizationSpecific ? role.description ?? look.blurb : look.blurb}
                                      </span>
                                    </span>
                                  </Choice>
                                );
                              })}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="primaryBranchId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Home branch</FormLabel>
                          <div role="radiogroup" aria-label="Home branch" className="flex flex-wrap gap-2">
                            {branches.isLoading && <div className="h-11 w-40 animate-pulse rounded-full bg-muted" />}
                            {branchList.map((branch) => {
                              const on = values.primaryBranchId === branch.id;
                              return (
                                <button
                                  key={branch.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  style={accentVars("blue")}
                                  onClick={() => form.setValue("primaryBranchId", branch.id, { shouldValidate: true })}
                                  className={cn(
                                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-ring",
                                    on
                                      ? "border-transparent text-[var(--tone-on)] shadow-sm [background-image:linear-gradient(135deg,var(--tone-grad-1),var(--tone-grad-2))]"
                                      : "hover:bg-muted",
                                  )}
                                >
                                  <MapPin className="size-3.5" aria-hidden="true" />
                                  {branch.name}
                                </button>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {branchList.length > 1 && (
                      <FormField
                        control={form.control}
                        name="allBranches"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between gap-3 rounded-2xl border p-4">
                            <div className="flex items-center gap-3">
                              <ToneIcon icon={Globe2} accent="indigo" />
                              <div>
                                <FormLabel className="mb-0 text-sm font-semibold">Works at every branch</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  {field.value ? "Their role applies at all branches." : `Their role applies at ${selectedBranch?.name ?? "their home branch"} only.`}
                                </p>
                              </div>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Works at every branch" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {step.id === "access" && (
                  <div className="flex flex-col gap-4">
                    <div role="radiogroup" aria-label="App access" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {ACCESS_OPTIONS.map((option) => (
                        <Choice
                          key={option.value}
                          accent={option.accent}
                          selected={values.access === option.value}
                          onSelect={() => selectAccess(option.value)}
                          label={option.title}
                          className="sm:flex-col"
                        >
                          <ToneIcon icon={option.icon} accent={option.accent} />
                          <span className="min-w-0 pr-5 sm:pr-0">
                            <span className="block text-sm font-semibold">{option.title}</span>
                            <span className="text-xs text-muted-foreground">{option.body}</span>
                          </span>
                        </Choice>
                      ))}
                    </div>

                    {values.access !== "NONE" ? (
                      <div className="flex flex-col gap-4 animate-in fade-in-0 duration-300 motion-reduce:animate-none">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email they sign in with</FormLabel>
                              <FormControl>
                                <Input type="email" autoComplete="off" inputMode="email" placeholder="name@example.com" className="h-11 rounded-xl" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {values.access === "PASSWORD" && (
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <FormControl>
                                      <Input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        className="h-11 rounded-xl pr-11 font-mono"
                                        {...field}
                                      />
                                    </FormControl>
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword((v) => !v)}
                                      className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                                    >
                                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                    </button>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 rounded-xl"
                                    onClick={() => {
                                      form.setValue("password", generatePassword(), { shouldValidate: true });
                                      setShowPassword(true);
                                    }}
                                  >
                                    <RefreshCw className="size-4" aria-hidden="true" />
                                    <span className="hidden sm:inline">New</span>
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">At least 10 characters. They can change it after signing in.</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    ) : (
                      <p
                        style={accentVars("amber")}
                        className="rounded-2xl bg-[var(--tone-wash)] p-4 text-sm text-[var(--tone-ink)]"
                      >
                        No email is needed. When they need the app later, use <strong>Give access</strong> on the staff list and we will email them an invite.
                      </p>
                    )}
                  </div>
                )}

                {step.id === "pay" && (
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="salaryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">How are they paid?</FormLabel>
                          <div role="radiogroup" aria-label="Salary type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {SALARY_OPTIONS.map((option) => {
                              const on = field.value === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  style={accentVars("amber")}
                                  onClick={() => {
                                    field.onChange(option.value);
                                    form.clearErrors("salaryAmount");
                                  }}
                                  className={cn(
                                    "min-h-11 rounded-xl border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-ring",
                                    on
                                      ? "border-transparent text-[var(--tone-on)] shadow-sm [background-image:linear-gradient(135deg,var(--tone-grad-1),var(--tone-grad-2))]"
                                      : "hover:bg-muted",
                                  )}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </FormItem>
                      )}
                    />
                    {values.salaryType !== "NONE" ? (
                      <FormField
                        control={form.control}
                        name="salaryAmount"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in-0 duration-300 motion-reduce:animate-none">
                            <FormLabel>Amount {salaryUnit}</FormLabel>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">₹</span>
                              <FormControl>
                                <Input inputMode="decimal" placeholder="0" className="h-12 rounded-xl pl-9 text-lg font-semibold tabular-nums" {...field} />
                              </FormControl>
                            </div>
                            {values.salaryType === "MONTHLY" && (
                              <p className="text-xs text-muted-foreground">A payroll run for part of a month pays the matching share.</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                        Skip for now. You can set pay any time on the Payroll page.
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="employeeCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee code <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                              <Input className="h-11 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hireDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Joining date <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                            <FormControl>
                              <Input type="date" className="h-11 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step.id === "review" && (
                  <div className="flex flex-col gap-3">
                    {[
                      {
                        icon: UserPlus,
                        accent: "violet" as Accent,
                        title: fullName,
                        lines: [values.jobTitle, values.phone, values.isTrainer ? `Trainer${values.specializations?.length ? ` · ${values.specializations.join(", ")}` : ""}` : null],
                        step: "profile" as StepId,
                      },
                      {
                        icon: selectedRole ? roleLook(selectedRole.key).icon : UserPlus,
                        accent: "blue" as Accent,
                        title: selectedRole?.name ?? "",
                        lines: [
                          selectedBranch?.name,
                          branchList.length > 1 ? (values.allBranches ? "Role applies at every branch" : "Role applies at their home branch only") : null,
                        ],
                        step: "role" as StepId,
                      },
                      {
                        icon: ACCESS_OPTIONS.find((o) => o.value === values.access)!.icon,
                        accent: "emerald" as Accent,
                        title: ACCESS_OPTIONS.find((o) => o.value === values.access)!.title,
                        lines: [values.access === "NONE" ? "No login" : values.email],
                        step: "access" as StepId,
                      },
                      ...(canSetPay
                        ? [
                            {
                              icon: Wallet,
                              accent: "amber" as Accent,
                              title:
                                values.salaryType === "NONE"
                                  ? "Pay not set yet"
                                  : `${displayCurrencyAmount(values.salaryAmount, "INR", 0)} ${salaryUnit}`,
                              lines: [values.employeeCode ? `Code ${values.employeeCode}` : null, values.hireDate ? `Joins ${values.hireDate}` : null],
                              step: "pay" as StepId,
                            },
                          ]
                        : []),
                    ].map((card) => (
                      <div key={card.step} className="flex items-center gap-3 rounded-2xl border p-3.5">
                        <ToneIcon icon={card.icon} accent={card.accent} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{card.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {card.lines.filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="min-h-9 rounded-full"
                          onClick={() => setStepIndex(steps.findIndex((s) => s.id === card.step))}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30 px-5 py-3.5 sm:px-6">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 rounded-full"
                  onClick={() => (stepIndex === 0 ? onOpenChange(false) : setStepIndex((i) => i - 1))}
                >
                  {stepIndex === 0 ? "Cancel" : (<><ArrowLeft className="size-4" aria-hidden="true" /> Back</>)}
                </Button>
                {/* Distinct keys: reusing one <button> and flipping its type to
                    "submit" mid-click made the browser submit the form from
                    the Continue click, skipping the review step. */}
                {isLast ? (
                  <Button
                    key="submit"
                    type="submit"
                    disabled={addStaff.isPending}
                    className="min-h-11 rounded-full px-6 font-bold shadow-sm"
                    style={{
                      ...accentVars("emerald"),
                      backgroundImage: "linear-gradient(135deg, var(--tone-grad-1), var(--tone-grad-2))",
                      color: "var(--tone-on)",
                    }}
                  >
                    {addStaff.isPending ? (
                      <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Adding...</>
                    ) : (
                      <><Check className="size-4" aria-hidden="true" /> Add {values.firstName || "staff"}</>
                    )}
                  </Button>
                ) : (
                  <Button key="next" type="button" className="min-h-11 rounded-full px-6 font-bold" onClick={next}>
                    Continue <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
