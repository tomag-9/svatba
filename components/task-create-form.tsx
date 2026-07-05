'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskPriorityLabels, taskStatusLabels } from '@/lib/labels';
import { taskCategoryOptions } from '@/lib/task-categories';

type TaskFormValues = {
  title?: string;
  description?: string;
  category?: string;
  phase?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  deadline?: string;
  notes?: string;
  resultInfo?: string;
};

type TaskCreateFormProps = {
  initialValues?: TaskFormValues;
  submitLabel?: string;
  endpoint?: string;
  method?: 'POST' | 'PATCH';
  successPath?: string;
};

export function TaskCreateForm({
  initialValues,
  submitLabel = 'Pridať úlohu',
  endpoint = '/api/tasks',
  method = 'POST',
  successPath
}: TaskCreateFormProps) {
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
        description: formData.get('description') || undefined,
        category: formData.get('category'),
        phase: formData.get('phase'),
        priority: formData.get('priority'),
        status: formData.get('status'),
        deadline: formData.get('deadline') || undefined,
        notes: formData.get('notes') || undefined,
        resultInfo: formData.get('resultInfo') || undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Nepodarilo sa vytvoriť úlohu.');
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
        <span>Názov úlohy</span>
        <input name="title" defaultValue={initialValues?.title ?? ''} required />
      </label>
      <label className="field">
        <span>Popis</span>
        <textarea name="description" defaultValue={initialValues?.description ?? ''} rows={4} placeholder="Čo patrí k tejto úlohe zo zdroja." />
      </label>
      <label className="field">
        <span>Kategória</span>
        <select name="category" defaultValue={initialValues?.category ?? 'Planning'}>
          {taskCategoryOptions.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Fáza</span>
        <input name="phase" defaultValue={initialValues?.phase ?? ''} />
      </label>
      <label className="field">
        <span>Priorita</span>
        <select name="priority" defaultValue={initialValues?.priority ?? 'MEDIUM'}>
          <option value="LOW">{taskPriorityLabels.LOW}</option>
          <option value="MEDIUM">{taskPriorityLabels.MEDIUM}</option>
          <option value="HIGH">{taskPriorityLabels.HIGH}</option>
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={initialValues?.status ?? 'TODO'}>
          <option value="TODO">{taskStatusLabels.TODO}</option>
          <option value="IN_PROGRESS">{taskStatusLabels.IN_PROGRESS}</option>
          <option value="DONE">{taskStatusLabels.DONE}</option>
          <option value="BLOCKED">{taskStatusLabels.BLOCKED}</option>
        </select>
      </label>
      <label className="field">
        <span>Deadline</span>
        <input name="deadline" type="date" defaultValue={initialValues?.deadline ?? ''} />
      </label>
      <label className="field">
        <span>Poznámky</span>
        <textarea name="notes" defaultValue={initialValues?.notes ?? ''} rows={5} placeholder="Sem si píš čo treba zariadiť, zavolať alebo skontrolovať." />
      </label>
      <label className="field">
        <span>Result info</span>
        <textarea name="resultInfo" defaultValue={initialValues?.resultInfo ?? ''} rows={4} placeholder="Čo sa zobrazí pod úlohou po vyriešení." />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ukladám...' : submitLabel}
      </button>
    </form>
  );
}
