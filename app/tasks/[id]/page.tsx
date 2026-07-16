import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { TaskCreateForm } from '@/components/task-create-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    returnTo?: string;
  }>;
};

function getReturnPath(path?: string) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/tasks';
  }

  return path;
}

export default async function TaskEditPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { returnTo } = (await searchParams) ?? {};
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    notFound();
  }

  return (
    <AppShell eyebrow="Úlohy" title="Detail úlohy" description="Tu si otvoríš úlohu, doplníš poznámky a upravíš deadline, status aj prioritu." compact>
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
          successPath={getReturnPath(returnTo)}
        />
      </article>
      <article className="panel panel-inline-actions">
        <DeleteEntityButton endpoint={`/api/tasks/${task.id}`} redirectTo={getReturnPath(returnTo)} label="Zmazať úlohu" />
      </article>
    </AppShell>
  );
}
