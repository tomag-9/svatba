import webPush from 'web-push';
import type { WeddingRole } from '@prisma/client';

import { prisma } from '@/lib/prisma';

type PushNotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

type PushSubscriptionInput = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  role?: WeddingRole;
};

let isConfigured = false;

function getPushConfig() {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT ?? 'mailto:hello@example.com';

  if (!publicKey || !privateKey) {
    throw new Error('WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY are required');
  }

  return { publicKey, privateKey, subject };
}

function ensureConfigured() {
  if (isConfigured) {
    return;
  }

  const { publicKey, privateKey, subject } = getPushConfig();
  webPush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
}

export function getPushPublicKey() {
  return getPushConfig().publicKey;
}

export async function storePushSubscription(subscription: PushSubscriptionInput) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: subscription.expirationTime ?? null,
      role: subscription.role
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expirationTime: subscription.expirationTime ?? null,
      role: subscription.role ?? 'ANGIE'
    }
  });
}

export async function deletePushSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function broadcastPushNotification(payload: PushNotificationPayload, filters?: { role?: WeddingRole }) {
  ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany({
    where: filters?.role ? { role: filters.role } : undefined
  });
  const message = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          message
        );
        return { endpoint: subscription.endpoint, delivered: true };
      } catch (error) {
        const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : null;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } });
        }

        throw error;
      }
    })
  );

  return {
    sent: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length
  };
}
