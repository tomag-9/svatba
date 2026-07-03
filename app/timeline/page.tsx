import { AppShell } from '@/components/app-shell';
import { TimelineBoard } from '@/components/timeline-board';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ deadline: 'asc' }, { priority: 'desc' }, { sortOrder: 'asc' }]
  });

  const timelineTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    notes: task.notes,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    priority: task.priority,
    status: task.status,
    category: task.category,
    phase: task.phase
  }));

  return (
    <AppShell
      eyebrow="Časová os"
      title="Plán na časovej osi"
      description="Zoradenie úloh podľa priority tak, aby bolo hneď jasné, čo riešiť najskôr."
    >
      <article className="panel">
        <h2>Časový plán</h2>
        <TimelineBoard initialTasks={timelineTasks} />
      </article>
    </AppShell>
  );
}
