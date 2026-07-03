'use client';

import { useEffect, useRef } from 'react';

import { getAlertRunKey, getWeddingAlertSlot } from '@/lib/alert-slot';

type AlertTask = {
  id: string;
  title: string;
  deadline: string | Date | null;
  priority: string;
  status: string;
};

type AlertsResponse = {
  settings: {
    deadlineAlertsEnabled: boolean;
    role: 'TOMI' | 'ANGIE';
    alertLeadDays: number;
    weddingDate: string | null;
  } | null;
  daysUntilWedding: number | null;
  slot?: 'morning' | 'afternoon' | 'evening';
  dueTasks: AlertTask[];
  countdown: {
    title: string;
    subtitle: string;
    dailyLine: string;
  } | null;
};

function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg'
  });
}

export function DeadlineAlerts() {
  const lastRunKey = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAlerts() {
      try {
        const slot = getWeddingAlertSlot();
        const response = await fetch(`/api/alerts?slot=${slot}`, { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as AlertsResponse;
        if (!payload.settings?.deadlineAlertsEnabled || Notification.permission !== 'granted') {
          return;
        }

        const currentKey = getAlertRunKey(slot);
        if (lastRunKey.current === currentKey || cancelled) {
          return;
        }

        lastRunKey.current = currentKey;

        if (payload.countdown?.title) {
          notify(payload.countdown.title, payload.countdown.dailyLine);
        }

        payload.dueTasks.slice(0, 3).forEach((task) => {
          const deadlineLabel = typeof task.deadline === 'string' ? task.deadline.slice(0, 10) : task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : 'TBD';
          notify(`Deadline: ${task.title}`, `Termín: ${deadlineLabel}. Status: ${task.status}.`);
        });
      } catch {
        // ignore network errors while offline
      }
    }

    void checkAlerts();
    const intervalId = window.setInterval(() => void checkAlerts(), 1000 * 60 * 15);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
