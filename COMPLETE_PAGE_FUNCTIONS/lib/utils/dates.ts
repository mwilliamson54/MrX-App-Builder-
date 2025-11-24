// lib/utils/dates.ts
export function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function toISOString(): string {
  return new Date().toISOString();
}