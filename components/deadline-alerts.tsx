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
    notificationTitle?: string;
    notificationBody?: string;
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
          notify(payload.countdown.notificationTitle ?? payload.countdown.title, payload.countdown.notificationBody ?? 'Pozri citát na dnes.');
        }
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
