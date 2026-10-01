/**
 * What an edit sends. The form holds "" for every blank box, and the
 * server rejects "" as an email or a date -- so saving any member without
 * an email or a birthday failed. A box left blank is not sent; one the
 * user emptied is cleared. The branch and coach are never cleared here.
 */
export function editPayload<T extends Record<string, unknown>>(values: T, initial: Partial<T>): Partial<T> {
 const keepOrOmit = new Set(["primaryBranchId", "assignedTrainerId", "firstName", "lastName"]);
 const out: Record<string, unknown> = {};
 for (const [key, value] of Object.entries(values)) {
 if (value !== "") out[key] = value;
 else if (!keepOrOmit.has(key) && initial[key as keyof T]) out[key] = null;
 }
 return out as Partial<T>;
}
