export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isInDateRange(value: string, fromDate?: string, toDate?: string): boolean {
  if (!fromDate && !toDate) {
    return true;
  }

  const candidate = new Date(value).getTime();
  if (Number.isNaN(candidate)) {
    return false;
  }

  const from = fromDate ? new Date(fromDate).getTime() : Number.NEGATIVE_INFINITY;
  const to = toDate ? new Date(toDate).getTime() : Number.POSITIVE_INFINITY;

  return candidate >= from && candidate <= to;
}
