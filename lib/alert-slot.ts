import type { WeddingAlertSlot } from '@/lib/wedding-copy';

const MORNING_END = 12;
const AFTERNOON_END = 18;

export function getWeddingAlertSlot(date = new Date()): WeddingAlertSlot {
  const hour = date.getHours();

  if (hour < MORNING_END) {
    return 'morning';
  }

  if (hour < AFTERNOON_END) {
    return 'afternoon';
  }

  return 'evening';
}

export function getAlertRunKey(slot: WeddingAlertSlot, date = new Date()) {
  const dayKey = date.toISOString().slice(0, 10);
  return `${dayKey}:${slot}`;
}