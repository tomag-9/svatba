import { AppShell } from '@/components/app-shell';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { TaskCreateForm } from '@/components/task-create-form';
import { taskPriorityLabels, taskStatusLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type TasksPageProps = {
  searchParams?: Promise<{
    status?: string;
    priority?: string;
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = (await searchParams) ?? {};
  const status = params.status ?? 'ALL';
  const priority = params.priority ?? 'ALL';

  const tasks = await prisma.task.findMany({
    orderBy: [{ deadline: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }]
  });

  const filteredTasks = tasks.filter((task) => {
    const statusMatches = status === 'ALL' || task.status === status;
    const priorityMatches = priority === 'ALL' || task.priority === priority;
    return statusMatches && priorityMatches;
  });

  const activeLink = (key: string, value: string) => `?status=${key === 'status' ? value : status}&priority=${key === 'priority' ? value : priority}`;

  return (
    <AppShell
      eyebrow="Úlohy"
      title="Úlohy a deadline"
      description="Prvé jadro CRUD sekcie pre plánovanie všetkých svadobných krokov."
    >
      <article className="panel">
        <h2>Filtre</h2>
        <div className="chip-row">
          {['ALL', 'TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].map((value) => (
            <Link key={value} href={activeLink('status', value)} className={`chip ${status === value ? 'active' : ''}`}>
              {value === 'ALL' ? 'Všetko' : taskStatusLabels[value as keyof typeof taskStatusLabels]}
            </Link>
          ))}
        </div>
        <div className="chip-row" style={{ marginTop: '10px' }}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => (
            <Link key={value} href={activeLink('priority', value)} className={`chip ${priority === value ? 'active' : ''}`}>
              {value === 'ALL' ? 'Všetko' : taskPriorityLabels[value as keyof typeof taskPriorityLabels]}
            </Link>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Pridať úlohu</h2>
        <TaskCreateForm />
      </article>

      <article className="panel">
        <h2>Aktuálny backlog</h2>
        <p className="lede" style={{ marginTop: 0 }}>Zobrazené: {filteredTasks.length} úloh</p>
        <div className="table-list">
          {filteredTasks.map((task) => (
            <div className="table-row" key={task.id}>
              <div>
                <Link className="row-title row-link" href={`/tasks/${task.id}`}>
                  {task.title}
                </Link>
                <div className="lede" style={{ margin: '6px 0 0' }}>
                  {task.category} · {task.phase}
                </div>
                {task.notes ? <div className="task-note-preview">{task.notes}</div> : null}
              </div>
              <div className="item-actions">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span className="tag">{taskStatusLabels[task.status]}</span>
                  <span className={`tag ${task.priority === 'HIGH' ? 'warn' : task.priority === 'MEDIUM' ? '' : 'good'}`}>
                    {taskPriorityLabels[task.priority]}
                  </span>
                </div>
                <div className="lede" style={{ margin: '8px 0 0' }}>
                  {task.deadline ? task.deadline.toISOString().slice(0, 10) : 'Bez termínu'}
                </div>
                <div className="item-action-row">
                  <Link className="button button-ghost" href={`/tasks/${task.id}`}>
                    Upraviť
                  </Link>
                  <DeleteEntityButton endpoint={`/api/tasks/${task.id}`} label="Zmazať" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
