import { NextResponse } from 'next/server';

import { deletePushSubscription, storePushSubscription } from '@/lib/push';

type PushSubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PushSubscriptionPayload | null;

  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
  }

  const subscription = await storePushSubscription({
    endpoint: body.endpoint,
    expirationTime: body.expirationTime ?? null,
    keys: {
      p256dh: body.keys.p256dh,
      auth: body.keys.auth
    }
  });

  return NextResponse.json({ subscription });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as PushSubscriptionPayload | null;

  if (!body?.endpoint) {
    return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
  }

  await deletePushSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}