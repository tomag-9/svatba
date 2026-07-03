import { NextResponse } from 'next/server';

import { getPushPublicKey } from '@/lib/push';

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getPushPublicKey() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Push config missing' }, { status: 500 });
  }
}