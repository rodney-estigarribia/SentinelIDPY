import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Secret key for HMAC verification
const SESSION_SECRET = process.env.SESSION_SECRET || 'sentinel-idpy-secure-session-secret-key-2026-very-long';

async function verifyTokenEdge(token: string, secret: string): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const [b64Payload, signature] = token.split('.');

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(b64Payload)
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSig = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (signature !== expectedSig) return false;

    // Check expiration
    const jsonStr = atob(b64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/cron') ||
    pathname === '/login' ||
    pathname.includes('.')
  ) {
    // If user is already authenticated and visits /login, redirect to dashboard
    if (pathname === '/login') {
      const session = request.cookies.get('sentinel_session')?.value;
      if (session && (await verifyTokenEdge(session, SESSION_SECRET))) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get('sentinel_session')?.value;

  if (!sessionCookie || !(await verifyTokenEdge(sessionCookie, SESSION_SECRET))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado: Sesión requerida.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
