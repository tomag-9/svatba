'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, PointerSensor, TouchSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { CategoryIcon } from '@/components/category-icon';
import { taskPriorityLabels, taskStatusLabels } from '@/lib/labels';

type TimelineTask = {
  id: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  deadline?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  category?: string | null;
  phase?: string | null;
};

type PriorityColumn = 'HIGH' | 'MEDIUM' | 'LOW';

const priorityLabels: Record<PriorityColumn, string> = {
  HIGH: 'Vysoká',
  MEDIUM: 'Stredná',
  LOW: 'Nízka'
};

const priorityOrder: PriorityColumn[] = ['HIGH', 'MEDIUM', 'LOW'];

function groupTasks(tasks: TimelineTask[]) {
  return tasks.reduce<Record<PriorityColumn, TimelineTask[]>>(
    (accumulator, task) => {
      accumulator[task.priority].push(task);
      return accumulator;
    },
    { HIGH: [], MEDIUM: [], LOW: [] }
  );
}

function taskSnippet(task: TimelineTask) {
  if (task.notes) {
    return task.notes;
  }

  if (task.description) {
    return task.description;
  }

  return `${task.phase ?? 'Fáza'} · ${task.category ?? 'Nezaradené'}`;
}

function DraggableTask({ task, onMove, isBusy }: { task: TimelineTask; onMove: (taskId: string, priority: PriorityColumn) => void; isBusy: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1
  };

  return (
    <article ref={setNodeRef} style={style} className={`timeline-card ${isDragging ? 'dragging' : ''}`}>
      <div className="timeline-card-top">
        <CategoryIcon category={task.category} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row-title">{task.title}</div>
          <div className="compact-meta">{task.category ?? 'Nezaradené'} · {task.deadline ? task.deadline.slice(0, 10) : 'Bez termínu'}</div>
        </div>
        <span className={`tag ${task.status === 'DONE' ? 'good' : task.status === 'BLOCKED' ? 'warn' : ''}`}>{taskStatusLabels[task.status]}</span>
        <button className="drag-handle" type="button" aria-label="Presunúť potiahnutím" {...attributes} {...listeners}>
          <GripVertical size={17} aria-hidden="true" />
        </button>
      </div>
      <p className="task-note-preview">{taskSnippet(task)}</p>
      <div className="timeline-move-row" aria-label="Presunúť do priority">
        {priorityOrder.map((priority) => (
          <button key={priority} type="button" className={`mini-chip ${task.priority === priority ? 'active' : ''}`} disabled={isBusy || task.priority === priority} onClick={() => onMove(task.id, priority)}>
            {priorityLabels[priority]}
          </button>
        ))}
      </div>
    </article>
  );
}

function PrioritySegment({
  priority,
  isActive,
  count,
  onSelect
}: {
  priority: PriorityColumn;
  isActive: boolean;
  count: number;
  onSelect: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: priority });

  return (
    <button ref={setNodeRef} type="button" className={`timeline-segment ${isActive ? 'active' : ''} ${isOver ? 'over' : ''}`} onClick={onSelect}>
      {priorityLabels[priority]} ({count})
    </button>
  );
}

export function TimelineBoard({ initialTasks }: { initialTasks: TimelineTask[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activePriority, setActivePriority] = useState<PriorityColumn>('HIGH');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } })
  );

  const groupedTasks = useMemo(() => groupTasks(tasks), [tasks]);
  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) ?? null : null;
  const visibleTasks = groupedTasks[activePriority];

  async function updatePriority(taskId: string, priority: PriorityColumn) {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? 'Nepodarilo sa zmeniť prioritu úlohy.');
    }
  }

  async function moveTask(taskId: string, nextPriority: PriorityColumn) {
    const currentTask = tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.priority === nextPriority || busy) {
      return;
    }

    const snapshot = tasks;
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, priority: nextPriority } : task)));
    setActivePriority(nextPriority);
    setBusy(true);
    setError(null);

    try {
      await updatePriority(taskId, nextPriority);
      router.refresh();
    } catch (error) {
      setTasks(snapshot);
      setError(error instanceof Error ? error.message : 'Nepodarilo sa zmeniť prioritu úlohy.');
    } finally {
      setBusy(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
    setError(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const destination = event.over?.id ? String(event.over.id) : null;
    setActiveTaskId(null);

    if (!destination || !priorityOrder.includes(destination as PriorityColumn)) {
      return;
    }

    const nextPriority = destination as PriorityColumn;
    const currentTask = tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.priority === nextPriority) {
      return;
    }

    await moveTask(taskId, nextPriority);
  }

  return (
    <div className="timeline-board">
      <p className="lede" style={{ marginTop: 0 }}>
        Prepni prioritu a podrž úlohu, ak ju chceš presunúť.
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="timeline-segments" aria-label="Priorita">
          {priorityOrder.map((priority) => (
            <PrioritySegment
              key={priority}
              priority={priority}
              count={groupedTasks[priority].length}
              isActive={activePriority === priority}
              onSelect={() => setActivePriority(priority)}
            />
          ))}
        </div>
        <div className="timeline-list">
          {visibleTasks.length === 0 ? <p className="timeline-empty">Žiadne úlohy v priorite {taskPriorityLabels[activePriority].toLowerCase()}.</p> : null}
          {visibleTasks.map((task) => (
            <DraggableTask key={task.id} task={task} onMove={(taskId, priority) => void moveTask(taskId, priority)} isBusy={busy} />
          ))}
        </div>
      </DndContext>
      {activeTask && busy ? <p className="timeline-empty">Ukladám presun: {activeTask.title}</p> : null}
    </div>
  );
}
