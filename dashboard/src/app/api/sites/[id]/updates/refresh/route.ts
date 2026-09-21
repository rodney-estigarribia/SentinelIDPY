import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient } from '@/lib/sentinel-wp-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = await dataService.getSiteById(siteId);

  if (!site) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  }

  if (site.type !== 'wordpress') {
    return NextResponse.json(
      { error: 'Solo los sitios WordPress soportan sincronización de actualizaciones' },
      { status: 400 }
    );
  }

  const token = site.token || process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0';

  try {
    const fresh = await sentinelWpClient.fetchUpdates(site.url, token);
    if (!fresh) {
      return NextResponse.json(
        { error: 'No se pudo obtener el estado de actualizaciones del sitio remoto' },
        { status: 502 }
      );
    }

    const details = [
      ...(fresh.plugins || []).map((p) => ({
        type: 'plugin' as const,
        name: p.name,
        slug: p.slug,
        currentVersion: p.current_version,
        newVersion: p.new_version,
      })),
      ...(fresh.themes || []).map((t) => ({
        type: 'theme' as const,
        name: t.name,
        slug: t.slug,
        currentVersion: t.current_version,
        newVersion: t.new_version,
      })),
    ];

    const pendingUpdates = {
      plugins: fresh.plugins?.length || 0,
      themes: fresh.themes?.length || 0,
      wordpress: fresh.wordpress?.update_available ? 1 : 0,
      details,
    };

    const updatedSite = await dataService.updateSite(siteId, { pendingUpdates });

    return NextResponse.json({
      success: true,
      pendingUpdates,
      site: updatedSite,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error de sincronización con WordPress' },
      { status: 500 }
    );
  }
}
