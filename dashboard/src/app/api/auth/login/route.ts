import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTOTP, createSessionToken } from '@/lib/totp';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const otpSecret = process.env.OTP_SECRET || 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    const sessionSecret = process.env.SESSION_SECRET || 'sentinel-idpy-secure-session-secret-key-2026-very-long';

    const isValid = verifyTOTP(code, otpSecret, 1);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código de autenticación inválido o expirado' },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken('admin', sessionSecret);

    const cookieStore = await cookies();
    cookieStore.set('sentinel_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
