'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ExpenseFormValues = {
  title?: string;
  category?: string;
  amount?: string;
  currency?: string;
  isPaid?: boolean;
};

type ExpenseCreateFormProps = {
  initialValues?: ExpenseFormValues;
  submitLabel?: string;
  endpoint?: string;
  method?: 'POST' | 'PATCH';
  successPath?: string;
};

export function ExpenseCreateForm({
  initialValues,
  submitLabel = 'Pridať výdavok',
  endpoint = '/api/expenses',
  method = 'POST',
  successPath
}: ExpenseCreateFormProps) {
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
        title: formData.get('title'),
        category: formData.get('category'),
        amount: formData.get('amount'),
        currency: formData.get('currency'),
        isPaid: formData.get('isPaid') === 'on'
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Nepodarilo sa vytvoriť výdavok.');
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
        <span>Názov výdavku</span>
        <input name="title" defaultValue={initialValues?.title ?? ''} required />
      </label>
      <label className="field">
        <span>Kategória</span>
        <input name="category" defaultValue={initialValues?.category ?? ''} />
      </label>
      <label className="field">
        <span>Suma</span>
        <input name="amount" type="number" step="0.01" min="0" defaultValue={initialValues?.amount ?? ''} required />
      </label>
      <label className="field">
        <span>Mena</span>
        <input name="currency" defaultValue={initialValues?.currency ?? 'EUR'} />
      </label>
      <label className="field checkbox-field">
        <input name="isPaid" type="checkbox" defaultChecked={initialValues?.isPaid ?? false} />
        <span>Zaplatené</span>
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ukladám...' : submitLabel}
      </button>
    </form>
  );
}

