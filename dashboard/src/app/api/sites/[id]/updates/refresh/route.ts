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
      { error: 'Solo los sitios WordPress soportan sincronización de actualizaciones' },
      { status: 400 }
    );
  }

  const token = getSiteToken(site);

  try {
    let details: Array<{
      type: 'plugin' | 'theme' | 'core';
      slug: string;
      name: string;
      currentVersion: string;
      newVersion: string;
    }> = [];
    let pendingUpdates = { plugins: 0, themes: 0, wordpress: 0, details };
    let extraFields: Record<string, any> = {};

    // 1. Intentar endpoint granular de updates (v4.3+)
    const freshRes = await sentinelWpClient.fetchUpdates(site.url, token);
    if (freshRes.ok && freshRes.data && freshRes.data.status === 'success') {
      const fresh = freshRes.data;
      details = [
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

      pendingUpdates = {
        plugins: fresh.plugins?.length || 0,
        themes: fresh.themes?.length || 0,
        wordpress: fresh.wordpress?.update_available ? 1 : 0,
        details,
      };

      if (fresh.wordpress?.current) {
        extraFields.wpVersion = fresh.wordpress.current;
      }
    } else {
      // 2. Fallback al endpoint de stats (v4.2), que siempre reporta pending_updates reales
      const statsRes = await sentinelWpClient.fetchStats(site.url, token);
      if (statsRes.ok && statsRes.data && statsRes.data.maintenance?.pending_updates) {
        const stats = statsRes.data;
        const pCounts = stats.maintenance?.pending_updates;
        pendingUpdates = {
          plugins: pCounts?.plugins || 0,
          themes: pCounts?.themes || 0,
          wordpress: pCounts?.wordpress || 0,
          details: [],
        };

        if (stats.infrastructure?.wp_version) {
          extraFields.wpVersion = stats.infrastructure.wp_version;
        }
        if (stats.infrastructure?.php_version) {
          extraFields.phpVersion = stats.infrastructure.php_version;
        }
        if (stats.wordfence) {
          extraFields.wordfenceStats = {
            totalAttacks: stats.wordfence.total_attacks,
            lastScan: stats.wordfence.last_scan,
            rulesOk: stats.wordfence.rules_ok,
            rulesDetail: stats.wordfence.rules_detail,
          };
        }
      } else {
        return NextResponse.json(
          {
            error: statsRes.error || 'No se pudo contactar el plugin SentinelIDPY en el sitio remoto',
            status: statsRes.status,
          },
          { status: 502 }
        );
      }
    }

    // Persistir estado sincronizado en base de datos
    const updatedSite = await dataService.updateSite(siteId, {
      token, // Asegura que el sitio tenga el token real guardado
      pendingUpdates,
      lastCheckedAt: new Date(),
      status: 'online',
      ...extraFields,
    });

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
