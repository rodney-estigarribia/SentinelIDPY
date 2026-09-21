import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient, getSiteToken } from '@/lib/sentinel-wp-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const wpSites = await dataService.getSites({ type: 'wordpress' });
    const results: Array<{
      id: number;
      name: string;
      url: string;
      success: boolean;
      pendingUpdates?: any;
      wpVersion?: string | null;
      phpVersion?: string | null;
      error?: string;
    }> = [];

    for (const site of wpSites) {
      const token = getSiteToken(site);
      try {
        // First try stats (v4.2)
        const stats = await sentinelWpClient.fetchStats(site.url, token);
        let pendingUpdates = { plugins: 0, themes: 0, wordpress: 0, details: [] as any[] };
        let wpVersion = site.wpVersion;
        let phpVersion = site.phpVersion;
        let sslDaysLeft = site.sslDaysLeft;
        let wordfenceStats = site.wordfenceStats;

        if (stats) {
          if (stats.maintenance?.pending_updates) {
            const pCounts = stats.maintenance.pending_updates;
            pendingUpdates = {
              plugins: pCounts.plugins || 0,
              themes: pCounts.themes || 0,
              wordpress: pCounts.wordpress || 0,
              details: [],
            };
          }
          if (stats.infrastructure?.wp_version) {
            wpVersion = stats.infrastructure.wp_version;
          }
          if (stats.infrastructure?.php_version) {
            phpVersion = stats.infrastructure.php_version;
          }
          if (stats.security?.ssl_days_left) {
            sslDaysLeft = typeof stats.security.ssl_days_left === 'number' ? stats.security.ssl_days_left : parseInt(String(stats.security.ssl_days_left), 10);
          }
          if (stats.wordfence) {
            wordfenceStats = {
              totalAttacks: stats.wordfence.total_attacks,
              lastScan: stats.wordfence.last_scan,
              rulesOk: stats.wordfence.rules_ok,
              rulesDetail: stats.wordfence.rules_detail,
              topIps: stats.wordfence.top_ips,
              topUrls: stats.wordfence.top_urls,
              topUsernames: stats.wordfence.top_usernames,
            };
          }

          // Try to get granular updates details if v4.3 endpoint is available
          try {
            const freshUpdates = await sentinelWpClient.fetchUpdates(site.url, token);
            if (freshUpdates && freshUpdates.status === 'success') {
              const details = [
                ...(freshUpdates.plugins || []).map((p) => ({
                  type: 'plugin' as const,
                  name: p.name,
                  slug: p.slug,
                  currentVersion: p.current_version,
                  newVersion: p.new_version,
                })),
                ...(freshUpdates.themes || []).map((t) => ({
                  type: 'theme' as const,
                  name: t.name,
                  slug: t.slug,
                  currentVersion: t.current_version,
                  newVersion: t.new_version,
                })),
              ];
              pendingUpdates = {
                plugins: freshUpdates.plugins?.length || 0,
                themes: freshUpdates.themes?.length || 0,
                wordpress: freshUpdates.wordpress?.update_available ? 1 : 0,
                details,
              };
            }
          } catch {
            // keep stats pendingUpdates
          }

          // Persist to Neon Postgres
          await dataService.updateSite(site.id, {
            token,
            status: 'online',
            lastStatusCode: 200,
            lastCheckedAt: new Date(),
            pendingUpdates,
            wpVersion,
            phpVersion,
            sslDaysLeft,
            wordfenceStats,
          });

          results.push({
            id: site.id,
            name: site.name,
            url: site.url,
            success: true,
            pendingUpdates,
            wpVersion,
            phpVersion,
          });
        } else {
          results.push({
            id: site.id,
            name: site.name,
            url: site.url,
            success: false,
            error: 'No se pudo conectar con el plugin SentinelIDPY en este sitio',
          });
        }
      } catch (err: any) {
        results.push({
          id: site.id,
          name: site.name,
          url: site.url,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización masiva de telemetría y actualizaciones completada.`,
      sitesCount: wpSites.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error en sincronización' },
      { status: 500 }
    );
  }
}
