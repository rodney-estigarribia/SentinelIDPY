import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient, getSiteToken } from '@/lib/sentinel-wp-client';

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

  const token = getSiteToken(site);

  try {
    const body = await request.json().catch(() => ({}));

    if (body.type === 'branding') {
      const res = await sentinelWpClient.updateBranding(site.url, token, {
        logo_url: body.logoUrl || body.logo_url,
        bg_color: body.bgColor || body.bg_color,
        footer_text: body.footerText || body.footer_text,
      });

      if (res.status === 'error') {
        return NextResponse.json({ error: res.message || 'Error al actualizar branding' }, { status: 500 });
      }

      await dataService.logActivity(siteId, 'branding_update', 'success');
      return NextResponse.json({ success: true, message: 'Branding actualizado en WordPress' });
    }

    if (body.type === 'widgets') {
      const res = await sentinelWpClient.updateWidgets(site.url, token, body.hiddenWidgets || []);
      if (res.status === 'error') {
        return NextResponse.json({ error: res.message || 'Error al actualizar widgets' }, { status: 500 });
      }

      await dataService.logActivity(siteId, 'widgets_update', 'success');
      return NextResponse.json({ success: true, message: 'Widgets sincronizados en WordPress' });
    }

    return NextResponse.json({ error: 'Tipo de acción no especificado (branding o widgets)' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
