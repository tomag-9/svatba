const encoder = new TextEncoder();
const sessionCookieName = 'svatba_session';
const sessionDurationMs = 1000 * 60 * 60 * 24 * 180;

function getPassword() {
  const password = process.env.WEDDING_APP_PASSWORD;
  if (!password) {
    throw new Error('WEDDING_APP_PASSWORD is required');
  }

  return password;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required');
  }

  return secret;
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Buffer.from(signature).toString('base64url');
}

export async function isValidPassword(password: string) {
  return password === getPassword();
}

export async function createSessionToken() {
  const expiresAt = Date.now() + sessionDurationMs;
  const payload = String(expiresAt);
  const signature = await sign(payload);
  return { token: `${payload}.${signature}`, expiresAt };
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = await sign(payload);
  if (expectedSignature !== signature) {
    return false;
  }

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt > Date.now();
}

export function getSessionCookieName() {
  return sessionCookieName;
}
