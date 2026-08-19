const formatters = new Map<number, Intl.NumberFormat>();

export function formatMoney(value: number, fractionDigits = 2): string {
  let f = formatters.get(fractionDigits);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatters.set(fractionDigits, f);
  }
  return f.format(value);
}
