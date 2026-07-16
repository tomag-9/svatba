export const WEDDING_ROLE_COOKIE = 'wedding-role';

export const weddingRoleValues = ['TOMI', 'ANGIE'] as const;

export type WeddingRoleValue = (typeof weddingRoleValues)[number];

export function parseWeddingRole(value: unknown): WeddingRoleValue | null {
  return typeof value === 'string' && weddingRoleValues.includes(value as WeddingRoleValue) ? (value as WeddingRoleValue) : null;
}

export function getWeddingRole(value: unknown, fallback: WeddingRoleValue = 'TOMI') {
  return parseWeddingRole(value) ?? fallback;
}

export function getWeddingRoleFromCookieHeader(cookieHeader: string | null) {
  const roleCookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WEDDING_ROLE_COOKIE}=`));

  if (!roleCookie) {
    return null;
  }

  return parseWeddingRole(decodeURIComponent(roleCookie.slice(WEDDING_ROLE_COOKIE.length + 1)));
}
