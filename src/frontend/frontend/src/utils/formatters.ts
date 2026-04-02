export function formatINR(amount: bigint | number): string {
  // If bigint: treat as paise (legacy). If number: treat as rupees.
  const rupees = typeof amount === "bigint" ? Number(amount) / 100 : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(nanoseconds: bigint | number | undefined): string {
  if (nanoseconds === undefined || nanoseconds === null) return "";
  const ms =
    typeof nanoseconds === "bigint"
      ? Number(nanoseconds) / 1_000_000
      : nanoseconds / 1_000_000;
  const date = new Date(ms);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function toNanoseconds(date: string): bigint {
  return BigInt(new Date(date).getTime()) * 1_000_000n;
}

export function toDateInputValue(
  nanoseconds: bigint | null | undefined,
): string {
  if (!nanoseconds) return "";
  const ms = Number(nanoseconds) / 1_000_000;
  const d = new Date(ms);
  return d.toISOString().split("T")[0];
}

export function nowNanoseconds(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}

export function isSameDay(ns: bigint, date: Date): boolean {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
}

export function isOnOrBefore(ns: bigint, date: Date): boolean {
  const ms = Number(ns) / 1_000_000;
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d <= date;
}
