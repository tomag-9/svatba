'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guestAttendanceLabels } from '@/lib/labels';

type GuestFormValues = {
  name?: string;
  familyGroup?: string;
  attendance?: 'NO' | 'MAYBE' | 'YES';
  dinner?: boolean;
  party?: boolean;
};

type GuestCreateFormProps = {
  initialValues?: GuestFormValues;
  submitLabel?: string;
  endpoint?: string;
  method?: 'POST' | 'PATCH';
  successPath?: string;
};

export function GuestCreateForm({
  initialValues,
  submitLabel = 'Pridať hosťa',
  endpoint = '/api/guests',
  method = 'POST',
  successPath
}: GuestCreateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        familyGroup: formData.get('familyGroup'),
        attendance: formData.get('attendance'),
        dinner: formData.get('dinner') === 'on',
        party: formData.get('party') === 'on'
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Nepodarilo sa vytvoriť hosťa.');
      return;
    }

    event.currentTarget.reset();
    if (successPath) {
      router.push(successPath);
      return;
    }

    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Meno</span>
        <input name="name" defaultValue={initialValues?.name ?? ''} required />
      </label>
      <label className="field">
        <span>Skupina</span>
        <input name="familyGroup" placeholder="Angelika / Tomáš" defaultValue={initialValues?.familyGroup ?? ''} />
      </label>
      <label className="field">
        <span>Potvrdenie</span>
        <select name="attendance" defaultValue={initialValues?.attendance ?? 'YES'}>
          <option value="NO">{guestAttendanceLabels.NO}</option>
          <option value="YES">{guestAttendanceLabels.YES}</option>
        </select>
      </label>
      <label className="field checkbox-field">
        <input name="dinner" type="checkbox" defaultChecked={initialValues?.dinner ?? false} />
        <span>Na obed</span>
      </label>
      <label className="field checkbox-field">
        <input name="party" type="checkbox" defaultChecked={initialValues?.party ?? false} />
        <span>Na párty</span>
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ukladám...' : submitLabel}
      </button>
    </form>
  );
}
