import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'sentinel-portal-secret-key-2026-very-secure';

export function createPortalToken(
  siteSlug: string,
  email: string = 'rodney.estigarribia@outlook.com',
  days: number = 7
): string {
  const exp = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ siteSlug, email, exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}
