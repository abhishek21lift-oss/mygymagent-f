const STORAGE_KEY = "mygymagent:current-branch";

let currentBranchId: string | undefined;

export function getCurrentBranchId(): string | undefined {
  if (currentBranchId !== undefined) return currentBranchId || undefined;
  if (typeof window === "undefined") return undefined;
  currentBranchId = window.localStorage.getItem(STORAGE_KEY) ?? "";
  return currentBranchId || undefined;
}

export function setCurrentBranchId(branchId: string | null | undefined): void {
  currentBranchId = branchId ?? "";
  if (typeof window === "undefined") return;
  if (branchId) window.localStorage.setItem(STORAGE_KEY, branchId);
  else window.localStorage.removeItem(STORAGE_KEY);
}
