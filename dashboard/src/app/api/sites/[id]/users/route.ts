import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient } from '@/lib/sentinel-wp-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = await dataService.getSiteById(siteId);

  if (!site) return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  if (site.type !== 'wordpress') {
    return NextResponse.json({ error: 'Solo aplica a sitios WordPress' }, { status: 400 });
  }

  const token = site.token || process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0';
  const users = await sentinelWpClient.fetchUsers(site.url, token);

  return NextResponse.json({ success: true, users });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = await dataService.getSiteById(siteId);

  if (!site) return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  if (site.type !== 'wordpress') {
    return NextResponse.json({ error: 'Solo aplica a sitios WordPress' }, { status: 400 });
  }

  const token = site.token || process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0';

  try {
    const body = await request.json().catch(() => ({}));
    const userId = parseInt(body.userId || body.user_id, 10);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Se requiere userId válido' }, { status: 400 });
    }

    const res = await sentinelWpClient.resetUserPassword(site.url, token, userId);

    if (res.status === 'error') {
      await dataService.logActivity(siteId, 'user_password_reset', 'failed', {
        userId,
        error: res.error,
      });
      return NextResponse.json(
        { error: res.error || 'Error al restablecer contraseña en WordPress' },
        { status: 500 }
      );
    }

    await dataService.logActivity(siteId, 'user_password_reset', 'success', { userId });

    return NextResponse.json({
      success: true,
      message: res.message || 'Correo de restablecimiento enviado correctamente',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
