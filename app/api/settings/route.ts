import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseString, readJsonBody } from '@/lib/request';
import { WEDDING_ROLE_CHANGE_CODE, WEDDING_ROLE_COOKIE, getWeddingRole, getWeddingRoleFromCookieHeader, parseWeddingRole } from '@/lib/wedding-role';

export async function GET() {
  const settings = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const body = await readJsonBody<{
    weddingDate?: unknown;
    weddingDateApproximate?: unknown;
    budgetTarget?: unknown;
    currency?: unknown;
    venueName?: unknown;
    notes?: unknown;
    role?: unknown;
    roleCode?: unknown;
    deadlineAlertsEnabled?: unknown;
    alertLeadDays?: unknown;
  }>(request);

  const role = parseWeddingRole(body?.role);
  const currentRole = getWeddingRole(getWeddingRoleFromCookieHeader(request.headers.get('cookie')), 'ANGIE');
  const roleCode = typeof body?.roleCode === 'string' ? body.roleCode : '';

  if (role && role !== currentRole && roleCode !== WEDDING_ROLE_CHANGE_CODE) {
    return NextResponse.json({ error: 'Na zmenu roly treba správny kód.' }, { status: 403 });
  }

  const existing = await prisma.weddingSettings.findFirst({ orderBy: { createdAt: 'desc' } });
  const data = {
    weddingDate: body?.weddingDate === null ? null : body?.weddingDate ? new Date(String(body.weddingDate)) : undefined,
    weddingDateApproximate: typeof body?.weddingDateApproximate === 'undefined' ? undefined : body?.weddingDateApproximate === true,
    budgetTarget: typeof body?.budgetTarget === 'undefined' || body?.budgetTarget === '' ? undefined : Number(body.budgetTarget),
    currency: parseString(body?.currency) ?? undefined,
    venueName: body?.venueName === null ? null : parseString(body?.venueName) ?? undefined,
    notes: body?.notes === null ? null : parseString(body?.notes) ?? undefined,
    deadlineAlertsEnabled: typeof body?.deadlineAlertsEnabled === 'undefined' ? undefined : body?.deadlineAlertsEnabled === true,
    alertLeadDays: typeof body?.alertLeadDays === 'undefined' || body?.alertLeadDays === '' ? undefined : Number(body.alertLeadDays)
  };

  const settings = existing
    ? await prisma.weddingSettings.update({ where: { id: existing.id }, data })
    : await prisma.weddingSettings.create({ data: { ...data, currency: data.currency ?? 'EUR' } });

  const response = NextResponse.json({ settings });

  if (role) {
    response.cookies.set(WEDDING_ROLE_COOKIE, role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });
  }

  return response;
}
