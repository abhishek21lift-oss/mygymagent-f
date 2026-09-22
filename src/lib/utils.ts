import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * THE CULT CLIENT is an India-first product. Monetary values in the UI always
 * use the Indian Rupee symbol, while the API currency field remains intact
 * for compatibility with existing records and contracts.
 */
export function currencySymbol(_currency?: string | null): string {
  return "₹";
}

export function displayCurrencyAmount(
  amount: number | string | null | undefined,
  currency?: string | null,
  fractionDigits = 2,
): string {
  const value = Number(amount ?? 0);
  return `${currencySymbol(currency)} ${value.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}
