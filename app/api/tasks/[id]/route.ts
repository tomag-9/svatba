import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseString, parseTaskPriority, parseTaskStatus, readJsonBody } from '@/lib/request';

type RouteParams = Promise<{ id: string }>;

export async function PATCH(request: Request, context: { params: RouteParams }) {
  const { id } = await context.params;
  const body = await readJsonBody<{
    title?: unknown;
    description?: unknown;
    notes?: unknown;
    deadline?: unknown;
    priority?: unknown;
    status?: unknown;
    category?: unknown;
    phase?: unknown;
    assignee?: unknown;
    sortOrder?: unknown;
  }>(request);

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: parseString(body?.title) ?? undefined,
      description: body?.description === null ? null : parseString(body?.description) ?? undefined,
      notes: body?.notes === null ? null : parseString(body?.notes) ?? undefined,
      deadline: body?.deadline === null ? null : body?.deadline ? new Date(String(body.deadline)) : undefined,
      priority: parseTaskPriority(body?.priority),
      status: parseTaskStatus(body?.status),
      category: body?.category === null ? null : parseString(body?.category) ?? undefined,
      phase: body?.phase === null ? null : parseString(body?.phase) ?? undefined,
      assignee: body?.assignee === null ? null : parseString(body?.assignee) ?? undefined,
      sortOrder: typeof body?.sortOrder === 'number' ? body.sortOrder : undefined
    }
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, context: { params: RouteParams }) {
  const { id } = await context.params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
