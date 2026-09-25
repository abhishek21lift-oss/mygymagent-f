import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export type SalaryType = "MONTHLY" | "DAILY" | "HOURLY"

/** A StaffProfile as `/hr-payroll/staff` returns it. `id` is the
 * StaffProfile id — the same id `TrainerCommission.trainerId` carries. */
export interface StaffPayroll {
  id: string
  userId: string
  branchId: string | null
  employeeCode: string | null
  jobTitle: string | null
  payrollEnabled: boolean
  salaryType: SalaryType | null
  baseSalary: string | null
  hourlyRate: string | null
  user: { id: string; firstName: string; lastName: string; email: string }
}

export const STAFF_PAYROLL_KEY = "hr-payroll-staff"

/**
 * The staff roster, shared by the two halves of the Payroll page.
 *
 * Extracted from `StaffPayrollSection`, which fetched it into local state
 * with its own loading and error flags. The commissions half needs the
 * same list to turn a StaffProfile id into a person's name, and a second
 * hand-rolled fetch would have meant two spinners and two failure paths
 * for one roster.
 *
 * `enabled` exists because the roster is an `hr.read` grant while
 * commissions are `payroll.read`: a reader may legitimately hold one and
 * not the other, and asking for a list they cannot see would put a 403 on
 * a page that is otherwise working.
 */
export function useStaffPayroll(enabled = true) {
  return useQuery({
    queryKey: [STAFF_PAYROLL_KEY],
    queryFn: async () => {
      const res = await api.get<{ items: StaffPayroll[] }>("/hr-payroll/staff")
      return res.items
    },
    enabled,
  })
}
