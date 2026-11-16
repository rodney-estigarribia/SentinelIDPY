import crypto from 'crypto';

/**
 * RFC 6238 TOTP (Time-based One-Time Password) implementation.
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords, 1Password.
 */

// Base32 alphabet
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32: string): Buffer {
  const cleanBase32 = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleanBase32.length; i++) {
    const char = cleanBase32[i];
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateHOTP(secretBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const code = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

export function verifyTOTP(
  token: string,
  secretBase32: string,
  window: number = 1
): boolean {
  if (!token || token.length !== 6 || !secretBase32) return false;

  try {
    const secretBuffer = base32Decode(secretBase32);
    const timeStep = 30; // 30-second interval
    const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

    // Check current step and +- window to handle slight time drift
    for (let i = -window; i <= window; i++) {
      const generated = generateHOTP(secretBuffer, currentCounter + i);
      if (generated === token.trim()) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('TOTP verification error:', err);
    return false;
  }
}

export function generateSessionSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(userId: string, secret: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const b64Payload = Buffer.from(payload).toString('base64url');
  const signature = generateSessionSignature(b64Payload, secret);
  return `${b64Payload}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): boolean {
  if (!token || !token.includes('.')) return false;
  const [b64Payload, signature] = token.split('.');
  const expectedSig = generateSessionSignature(b64Payload, secret);

  if (signature !== expectedSig) return false;

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return false; // Expired
    }
    return true;
  } catch {
    return false;
  }
}
