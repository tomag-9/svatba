import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { TaskCreateForm } from '@/components/task-create-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskEditPage({ params }: PageProps) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    notFound();
  }

  return (
    <AppShell eyebrow="Úlohy" title="Detail úlohy" description="Tu si otvoríš úlohu, doplníš poznámky a upravíš deadline, status aj prioritu.">
      <article className="panel">
        <TaskCreateForm
          initialValues={{
            title: task.title,
            description: task.description ?? '',
            category: task.category ?? '',
            phase: task.phase ?? '',
            priority: task.priority,
            status: task.status,
            deadline: task.deadline ? task.deadline.toISOString().slice(0, 10) : '',
            notes: task.notes ?? '',
            resultInfo: task.resultInfo ?? ''
          }}
          submitLabel="Uložiť úlohu"
          endpoint={`/api/tasks/${task.id}`}
          method="PATCH"
          successPath="/tasks"
        />
      </article>
      <article className="panel panel-inline-actions">
        <DeleteEntityButton endpoint={`/api/tasks/${task.id}`} redirectTo="/tasks" label="Zmazať úlohu" />
      </article>
    </AppShell>
  );
}
