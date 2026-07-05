import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseString, parseTaskPriority, parseTaskStatus, readJsonBody } from '@/lib/request';

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ deadline: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }]
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = await readJsonBody<{
    title?: unknown;
    description?: unknown;
    notes?: unknown;
    resultInfo?: unknown;
    deadline?: unknown;
    priority?: unknown;
    status?: unknown;
    category?: unknown;
    phase?: unknown;
    assignee?: unknown;
    sortOrder?: unknown;
  }>(request);

  const title = parseString(body?.title);
  if (!title) {
    return NextResponse.json({ error: 'Názov úlohy je povinný' }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: parseString(body?.description),
      notes: parseString(body?.notes),
      resultInfo: parseString(body?.resultInfo),
      deadline: body?.deadline ? new Date(String(body.deadline)) : null,
      priority: parseTaskPriority(body?.priority),
      status: parseTaskStatus(body?.status),
      category: parseString(body?.category),
      phase: parseString(body?.phase),
      assignee: parseString(body?.assignee),
      sortOrder: typeof body?.sortOrder === 'number' ? body.sortOrder : 0
    }
  });

  return NextResponse.json({ task }, { status: 201 });
}
