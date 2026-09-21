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

  if (!site) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  }

  if (site.type !== 'wordpress') {
    return NextResponse.json(
      { error: 'Las actualizaciones solo aplican a sitios WordPress' },
      { status: 400 }
    );
  }

  const token = getSiteToken(site);

  try {
    const body = await request.json().catch(() => ({}));
    const updateType = (body.type || 'plugins') as 'all' | 'core' | 'plugins' | 'themes';
    const slugs = Array.isArray(body.slugs) ? body.slugs : undefined;

    const res = await sentinelWpClient.applyUpdates(site.url, token, {
      type: updateType,
      slugs,
    });

    if (res.status === 'error') {
      await dataService.logActivity(siteId, `update_${updateType}`, 'failed', {
        error: res.error,
        slugs,
      });
      return NextResponse.json(
        { error: res.error || 'Error al procesar actualizaciones en WordPress' },
        { status: 500 }
      );
    }

    await dataService.logActivity(siteId, `update_${updateType}`, 'success', {
      results: res.results,
      slugs,
    });

    // Optionally trigger background refresh of updates for this site
    sentinelWpClient.fetchUpdates(site.url, token).then(async (freshRes) => {
      if (freshRes.ok && freshRes.data) {
        const fresh = freshRes.data;
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
        await dataService.updateSite(siteId, {
          pendingUpdates: {
            plugins: fresh.plugins?.length || 0,
            themes: fresh.themes?.length || 0,
            wordpress: fresh.wordpress?.update_available ? 1 : 0,
            details,
          },
        });
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Actualizaciones aplicadas correctamente en WordPress',
      results: res.results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error de conexión con el sitio remoto' },
      { status: 500 }
    );
  }
}
