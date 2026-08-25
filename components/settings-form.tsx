'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { weddingRoleLabels } from '@/lib/labels';
import { WEDDING_ROLE_COOKIE, type WeddingRoleValue } from '@/lib/wedding-role';

type SettingsValues = {
  weddingDate?: string;
  weddingDateApproximate?: boolean;
  budgetTarget?: string;
  venueName?: string;
  notes?: string;
  role?: WeddingRoleValue;
  deadlineAlertsEnabled?: boolean;
  alertLeadDays?: string;
};

export function SettingsForm({ initialValues }: { initialValues?: SettingsValues }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [quoteDraft, setQuoteDraft] = useState('');
  const [quoteStatus, setQuoteStatus] = useState<string | null>(null);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [role, setRole] = useState<WeddingRoleValue>(initialValues?.role ?? 'TOMI');

  function persistRole(nextRole: WeddingRoleValue) {
    setRole(nextRole);
    document.cookie = `${WEDDING_ROLE_COOKIE}=${encodeURIComponent(nextRole)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; ++index) {
      outputArray[index] = rawData.charCodeAt(index);
    }

    return outputArray;
  }

  async function ensureNotificationPermission() {
    if (!('Notification' in window)) {
      throw new Error('Tento prehliadač nepodporuje notifikácie.');
    }

    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notifikácie neboli povolené.');
    }
  }

  async function enableBackgroundNotifications(sendTest = false) {
    setError(null);
    setPushStatus(null);

    try {
      await ensureNotificationPermission();

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Tento prehliadač nepodporuje background push.');
      }

      const publicKeyResponse = await fetch('/api/push/public-key', { cache: 'no-store' });
      if (!publicKeyResponse.ok) {
        throw new Error('Chýba VAPID public key.');
      }

      const { publicKey } = (await publicKeyResponse.json()) as { publicKey?: string };
      if (!publicKey) {
        throw new Error('Push public key nie je nastavený.');
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON())
      });

      if (!subscribeResponse.ok) {
        const payload = (await subscribeResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Nepodarilo sa uložiť push subscription.');
      }

      const periodicSync = (registration as ServiceWorkerRegistration & {
        periodicSync?: { register: (tag: string, options?: { minInterval?: number }) => Promise<void> };
      }).periodicSync;

      if (periodicSync) {
        try {
          await periodicSync.register('svatba-alerts', { minInterval: 1000 * 60 * 30 });
        } catch {
          // periodic sync is optional; ignore if browser rejects it
        }
      }

      setPushStatus(sendTest ? 'Push subscription je aktívna, posielam testovací alert.' : 'Push subscription je aktívna.');

      if (sendTest) {
        const testResponse = await fetch('/api/push/test', { method: 'POST' });
        if (!testResponse.ok) {
          const payload = (await testResponse.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? 'Test push zlyhal.');
        }

        setPushStatus('Testovací alert odoslaný.');
      }
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : 'Nepodarilo sa zapnúť background notifikácie.');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weddingDate: formData.get('weddingDate') || null,
        weddingDateApproximate: formData.get('weddingDateApproximate') === 'on',
        budgetTarget: formData.get('budgetTarget') || null,
        venueName: formData.get('venueName'),
        notes: formData.get('notes') || null,
        role,
        deadlineAlertsEnabled: formData.get('deadlineAlertsEnabled') === 'on',
        alertLeadDays: formData.get('alertLeadDays')
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Nepodarilo sa uložiť nastavenia.');
      return;
    }

    router.refresh();
  }

  async function addCountdownQuote() {
    const line = quoteDraft.trim();

    if (!line) {
      setQuoteStatus(null);
      setError('Napíš citát, ktorý chceš pridať.');
      return;
    }

    setError(null);
    setQuoteStatus(null);
    setIsSavingQuote(true);

    const response = await fetch('/api/countdown-lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line })
    });

    setIsSavingQuote(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Citát sa nepodarilo uložiť.');
      return;
    }

    setQuoteDraft('');
    setQuoteStatus('Citát je uložený v databáze a zaradený na koniec aktuálneho cyklu.');
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Dátum svadby</span>
        <input name="weddingDate" type="date" defaultValue={initialValues?.weddingDate ?? ''} />
      </label>
      <label className="field checkbox-field">
        <input name="weddingDateApproximate" type="checkbox" defaultChecked={initialValues?.weddingDateApproximate ?? false} />
        <span>Dátum je zatiaľ približný</span>
      </label>
      <label className="field">
        <span>Cieľ rozpočtu</span>
        <input name="budgetTarget" type="number" step="0.01" min="0" defaultValue={initialValues?.budgetTarget ?? ''} />
      </label>
      <label className="field">
        <span>Sála / miesto</span>
        <input name="venueName" defaultValue={initialValues?.venueName ?? ''} />
      </label>
      <div className="field">
        <span>Som</span>
        <div className="chip-row" role="radiogroup" aria-label="Kto používa tento prehliadač">
          <label className={`chip role-chip ${role === 'TOMI' ? 'active' : ''}`}>
            <input type="radio" name="role" value="TOMI" checked={role === 'TOMI'} onChange={() => persistRole('TOMI')} />
            {weddingRoleLabels.TOMI}
          </label>
          <label className={`chip role-chip ${role === 'ANGIE' ? 'active' : ''}`}>
            <input type="radio" name="role" value="ANGIE" checked={role === 'ANGIE'} onChange={() => persistRole('ANGIE')} />
            {weddingRoleLabels.ANGIE}
          </label>
        </div>
      </div>
      <section className="settings-section">
        <div>
          <h3>Poznámky</h3>
          <p className="compact-meta">Spoločné veci, ktoré nechceme stratiť medzi úlohami.</p>
        </div>
        <label className="field">
          <span>Poznámky</span>
          <textarea name="notes" defaultValue={initialValues?.notes ?? ''} rows={7} placeholder="Nápady, dohody, otázky na sálu, veci na prebrať..." />
        </label>
      </section>
      {role === 'TOMI' ? (
        <section className="settings-section">
          <div>
            <h3>Nový citát</h3>
            <p className="compact-meta">Uloží sa do databázy a zaradí sa na koniec aktuálneho cyklu.</p>
          </div>
          <label className="field">
            <span>Citát pre Angie</span>
            <input
              maxLength={240}
              value={quoteDraft}
              onChange={(event) => setQuoteDraft(event.target.value)}
              placeholder="A potom..."
            />
          </label>
          <button
            className="button button-ghost"
            type="button"
            disabled={isSavingQuote}
            onClick={() => void addCountdownQuote()}
          >
            {isSavingQuote ? 'Pridávam...' : 'Pridať citát'}
          </button>
          {quoteStatus ? <p className="lede">{quoteStatus}</p> : null}
        </section>
      ) : null}
      <label className="field checkbox-field">
        <input name="deadlineAlertsEnabled" type="checkbox" defaultChecked={initialValues?.deadlineAlertsEnabled ?? false} />
        <span>Zapnúť upozornenia na deadliny</span>
      </label>
      <label className="field">
        <span>Upozorniť vopred o koľko dní</span>
        <input name="alertLeadDays" type="number" min="1" max="30" defaultValue={initialValues?.alertLeadDays ?? '3'} />
      </label>
      <button
        className="button button-ghost"
        type="button"
        onClick={() => void enableBackgroundNotifications(false)}
      >
        Zapnúť notifikácie na pozadí
      </button>
      <button
        className="button button-ghost"
        type="button"
        onClick={() => void enableBackgroundNotifications(true)}
      >
        Otestovať notifikáciu
      </button>
      {pushStatus ? <p className="lede">{pushStatus}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ukladám...' : 'Uložiť nastavenia'}
      </button>
    </form>
  );
}
