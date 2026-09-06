import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWeddingAlertSlot } from '@/lib/alert-slot';
import { getWeddingRole, getWeddingRoleFromCookieHeader } from '@/lib/wedding-role';
import { getWeddingCountdownCopy } from '@/lib/wedding-copy';

const DAY_MS = 1000 * 60 * 60 * 24;

type AlertTaskRecord = {
  id: string;
  title: string;
  deadline: Date | null;
  priority: string;
  status: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slot = url.searchParams.get('slot');
  const alertSlot = slot === 'morning' || slot === 'afternoon' || slot === 'evening' ? slot : getWeddingAlertSlot();

  const [settings, tasks] = await Promise.all([
    prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.task.findMany({ where: { status: { not: 'DONE' } }, orderBy: [{ deadline: 'asc' }, { priority: 'desc' }] })
  ]);
  const role = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), settings?.role ?? 'ANGIE');

  const daysUntilWedding = settings?.weddingDate ? Math.ceil((settings.weddingDate.getTime() - Date.now()) / DAY_MS) : null;
  const alertLeadDays = settings?.alertLeadDays ?? 3;
  const dueTasks = tasks.filter((task: AlertTaskRecord) => {
    if (!task.deadline) {
      return false;
    }

    const diffDays = Math.ceil((task.deadline.getTime() - Date.now()) / DAY_MS);
    return diffDays >= 0 && diffDays <= alertLeadDays;
  });

  const countdown = settings ? await getWeddingCountdownCopy({ daysUntilWedding, role, slot: alertSlot, isApproximate: settings.weddingDateApproximate }) : null;

  return NextResponse.json({
    settings,
    daysUntilWedding,
    slot: alertSlot,
    dueTasks: dueTasks.map((task) => ({
      id: task.id,
      title: task.title,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status
    })),
    countdown
  });
}
