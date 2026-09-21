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
  const plugins = await sentinelWpClient.fetchPlugins(site.url, token);

  return NextResponse.json({ success: true, plugins });
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
    const { slug, zipUrl, activate = true } = body;

    if (!slug && !zipUrl) {
      return NextResponse.json(
        { error: 'Se requiere especificar "slug" o "zipUrl"' },
        { status: 400 }
      );
    }

    const res = await sentinelWpClient.installPlugin(site.url, token, {
      slug,
      zipUrl,
      activate,
    });

    if (res.status === 'error') {
      await dataService.logActivity(siteId, 'plugin_install', 'failed', {
        error: res.error,
        slug,
        zipUrl,
      });
      return NextResponse.json(
        { error: res.error || 'Error al instalar plugin en WordPress' },
        { status: 500 }
      );
    }

    await dataService.logActivity(siteId, 'plugin_install', 'success', {
      slug,
      zipUrl,
      activate,
    });

    return NextResponse.json({
      success: true,
      message: res.message || 'Plugin instalado exitosamente',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { slug, action } = body;

    if (!slug || !action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Se requiere "slug" y action: "activate" | "deactivate"' },
        { status: 400 }
      );
    }

    const res = await sentinelWpClient.togglePlugin(site.url, token, slug, action);

    if (res.status === 'error') {
      await dataService.logActivity(siteId, `plugin_${action}`, 'failed', {
        slug,
        error: res.error,
      });
      return NextResponse.json(
        { error: res.error || `Error al ${action} el plugin` },
        { status: 500 }
      );
    }

    await dataService.logActivity(siteId, `plugin_${action}`, 'success', { slug });

    return NextResponse.json({
      success: true,
      message: `Plugin ${slug} ${action === 'activate' ? 'activado' : 'desactivado'} con éxito`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
