export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return false;
}

export function parseString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const taskPriorityValues = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const taskStatusValues = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;
export const guestAttendanceValues = ['NO', 'MAYBE', 'YES'] as const;

export function parseTaskPriority(value: unknown) {
  return typeof value === 'string' && taskPriorityValues.includes(value as (typeof taskPriorityValues)[number])
    ? (value as (typeof taskPriorityValues)[number])
    : undefined;
}

export function parseTaskStatus(value: unknown) {
  return typeof value === 'string' && taskStatusValues.includes(value as (typeof taskStatusValues)[number])
    ? (value as (typeof taskStatusValues)[number])
    : undefined;
}

export function parseGuestAttendance(value: unknown) {
  return typeof value === 'string' && guestAttendanceValues.includes(value as (typeof guestAttendanceValues)[number])
    ? (value as (typeof guestAttendanceValues)[number])
    : undefined;
}
