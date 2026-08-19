const formatters = new Map<number, Intl.NumberFormat>();

export function formatMoney(value: number, fractionDigits = 2): string {
  let formatter = formatters.get(fractionDigits);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(fractionDigits, formatter);
  }
  return formatter.format(value);
}
