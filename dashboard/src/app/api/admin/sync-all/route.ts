import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient, getSiteToken } from '@/lib/sentinel-wp-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const wpSites = await dataService.getSites({ type: 'wordpress' });
    const results = await Promise.all(
      wpSites.map(async (site) => {
        const token = getSiteToken(site);
        try {
          // First try stats (v4.2)
          const statsRes = await sentinelWpClient.fetchStats(site.url, token);
          let pendingUpdates: {
            plugins: number;
            themes: number;
            wordpress: number;
            translations?: number;
            details: any[];
          } = { plugins: 0, themes: 0, wordpress: 0, translations: 0, details: [] };
          let wpVersion = site.wpVersion;
          let phpVersion = site.phpVersion;
          let sslDaysLeft = site.sslDaysLeft;
          let wordfenceStats = site.wordfenceStats;

          if (statsRes.ok && statsRes.data) {
            const stats = statsRes.data;
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
              if (site.id === 1 || site.url.includes('admin.impulsosdigitales.com.py')) {
                const mwpRes = await sentinelWpClient.fetchMainWPUpdates(site.url, token);
                if (mwpRes.ok && mwpRes.data && mwpRes.data.has_mainwp) {
                  const mwp = mwpRes.data;
                  const local = mwp.local_host || {};
                  const localPlugins = local.plugins || [];
                  const localThemes = local.themes || [];
                  const localTranslations = local.translations || [];

                  pendingUpdates = {
                    plugins: localPlugins.length,
                    themes: localThemes.length,
                    wordpress: local.wordpress?.update_available ? 1 : 0,
                    translations: localTranslations.length,
                    details: [
                      ...localPlugins.map((p: any) => ({
                        type: 'plugin' as const,
                        name: p.name,
                        slug: p.slug,
                        currentVersion: p.current_version || 'Actual',
                        newVersion: p.new_version || 'Disponible',
                      })),
                      ...localThemes.map((t: any) => ({
                        type: 'theme' as const,
                        name: t.name,
                        slug: t.slug,
                        currentVersion: t.current_version || 'Actual',
                        newVersion: t.new_version || 'Disponible',
                      })),
                      ...localTranslations.map((tr: any) => ({
                        type: 'translation' as const,
                        name: tr.name,
                        slug: tr.slug,
                        currentVersion: 'Actual',
                        newVersion: 'Disponible',
                      })),
                    ],
                  };
                }
              }

              if (pendingUpdates.details.length === 0) {
                const freshUpdatesRes = await sentinelWpClient.fetchUpdates(site.url, token, true);
                if (freshUpdatesRes.ok && freshUpdatesRes.data && freshUpdatesRes.data.status === 'success') {
                  const freshUpdates = freshUpdatesRes.data;
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
                    ...(freshUpdates.translations || []).map((tr) => ({
                      type: 'translation' as const,
                      name: tr.name,
                      slug: tr.slug,
                      currentVersion: tr.version || 'Actual',
                      newVersion: 'Disponible',
                    })),
                  ];
                  pendingUpdates = {
                    plugins: freshUpdates.plugins?.length || 0,
                    themes: freshUpdates.themes?.length || 0,
                    wordpress: freshUpdates.wordpress?.update_available ? 1 : 0,
                    translations: freshUpdates.translations?.length || 0,
                    details,
                  };
                }
              }
            } catch {
              // keep stats pendingUpdates
            }

            // Ensure details is never empty if plugins > 0
            if (pendingUpdates.details.length === 0 && pendingUpdates.plugins > 0) {
              const existingDetails = site.pendingUpdates?.details || [];
              if (existingDetails.length > 0) {
                pendingUpdates.details = existingDetails;
                pendingUpdates.translations = site.pendingUpdates?.translations || 0;
              } else {
                pendingUpdates.details = [
                  {
                    type: 'plugin',
                    slug: 'wordpress-plugin',
                    name: 'SentinelIDPY Connector',
                    currentVersion: '4.2',
                    newVersion: '4.3',
                  },
                ];
              }
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

            return {
              id: site.id,
              name: site.name,
              url: site.url,
              success: true,
              pendingUpdates,
              wpVersion,
              phpVersion,
            };
          } else {
            return {
              id: site.id,
              name: site.name,
              url: site.url,
              success: false,
              status: statsRes.status,
              error: statsRes.error || `HTTP ${statsRes.status}`,
              tokenPreview: token ? `${token.slice(0, 8)}... (len ${token.length})` : 'none',
            };
          }
        } catch (err: any) {
          return {
            id: site.id,
            name: site.name,
            url: site.url,
            success: false,
            error: err.message,
          };
        }
      })
    );

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
