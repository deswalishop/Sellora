/** Rs formatting shared across dashboard & storefront. */
export function formatRs(n: number | null | undefined): string {
  if (n == null) return "—";
  return `Rs ${Number(n).toLocaleString("en-PK")}`;
}
