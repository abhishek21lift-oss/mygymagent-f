/**
 * An amount as the API sends it -- Prisma Decimals arrive as strings --
 * in the currency it was charged in.
 */
export function formatMoney(
  value: string | number,
  currency: string,
  { whole = false }: { whole?: boolean } = {},
) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return `${currency} ${String(value)}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      ...(whole ? { maximumFractionDigits: 0 } : {}),
    }).format(amount);
  } catch {
    // An unrecognised currency code should show the number, not throw.
    return `${currency} ${amount}`;
  }
}
