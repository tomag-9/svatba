import { AppShell } from '@/components/app-shell';
import { CategoryIcon } from '@/components/category-icon';
import { DeleteEntityButton } from '@/components/delete-entity-button';
import { TaskCreateForm } from '@/components/task-create-form';
import { taskPriorityLabels, taskStatusLabels } from '@/lib/labels';
import { prisma } from '@/lib/prisma';
import { getTaskCategoryLabel } from '@/lib/task-categories';
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
  const activeTasks = filteredTasks.filter((task) => task.status !== 'DONE');
  const doneTasks = filteredTasks.filter((task) => task.status === 'DONE');
  const taskSections =
    status === 'ALL'
      ? [
          { key: 'active', label: 'Na vybavenie', rows: activeTasks },
          { key: 'done', label: 'Vybavené', rows: doneTasks }
        ].filter((section) => section.rows.length > 0)
      : [{ key: status.toLowerCase(), label: status === 'DONE' ? 'Vybavené' : 'Na vybavenie', rows: filteredTasks }];

  const activeLink = (key: string, value: string) => `?status=${key === 'status' ? value : status}&priority=${key === 'priority' ? value : priority}`;
  const returnTo = `/tasks?status=${encodeURIComponent(status)}&priority=${encodeURIComponent(priority)}`;
  const editHref = (taskId: string) => `/tasks/${taskId}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <AppShell
      eyebrow="Úlohy"
      title="Úlohy a deadline"
    >
      <article className="panel">
        <h2>Filtre</h2>
        <div className="chip-row chip-row-scroll">
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

      <article className="panel" id="add-task">
        <h2>Pridať úlohu</h2>
        <TaskCreateForm successPath="/timeline" />
      </article>

      <article className="panel">
        <h2>Aktuálny backlog</h2>
        <p className="lede" style={{ marginTop: 0 }}>Zobrazené: {filteredTasks.length} úloh</p>
        {taskSections.map((section) => (
          <section className="task-section" key={section.key}>
            <div className={`timeline-section-label ${section.key === 'done' ? 'done' : ''}`}>{section.label}</div>
            <div className="table-list">
              {section.rows.map((task) => (
                <div className={`table-row task-list-row ${task.status === 'DONE' ? 'is-done' : ''}`} key={task.id}>
                  <CategoryIcon category={task.category} size={32} />
                  <div className="task-list-main">
                    <Link className="row-title row-link" href={editHref(task.id)}>
                      {task.title}
                    </Link>
                    <div className="compact-meta">
                      {getTaskCategoryLabel(task.category)} · {task.deadline ? task.deadline.toISOString().slice(0, 10) : 'Bez termínu'}
                    </div>
                    {task.description ? <div className="task-note-preview">{task.description}</div> : null}
                    {task.notes ? <div className="task-note-preview">{task.notes}</div> : null}
                    {task.status === 'DONE' && task.resultInfo ? <div className="task-result-info">{task.resultInfo}</div> : null}
                  </div>
                  <span className="tag task-status-tag">{taskStatusLabels[task.status]}</span>
                  <div className="item-action-row task-inline-actions">
                    <Link className="button button-ghost" href={editHref(task.id)}>
                      Upraviť
                    </Link>
                    <DeleteEntityButton endpoint={`/api/tasks/${task.id}`} label="Zmazať" />
                  </div>
                </div>
              ))}
            </div>
          </section>
          ))}
      </article>
    </AppShell>
  );
}
