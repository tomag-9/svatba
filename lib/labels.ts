import type { GuestAttendance, TaskPriority, TaskStatus, WeddingRole } from '@prisma/client';

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: 'Nízka',
  MEDIUM: 'Stredná',
  HIGH: 'Vysoká'
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'Na vybavenie',
  IN_PROGRESS: 'V riešení',
  DONE: 'Hotovo',
  BLOCKED: 'Zablokované'
};

export const guestAttendanceLabels: Record<GuestAttendance, string> = {
  NO: 'Nie',
  MAYBE: 'Možno',
  YES: 'Áno'
};

export const weddingRoleLabels: Record<WeddingRole, string> = {
  TOMI: 'Tomi',
  ANGIE: 'Angie'
};

export const navLabels = {
  dashboard: 'Prehľad',
  timeline: 'Časová os',
  tasks: 'Úlohy',
  invitees: 'Hostia',
  finance: 'Rozpočet',
  settings: 'Nastavenia'
} as const;