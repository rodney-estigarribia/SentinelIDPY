import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { createPortalToken } from '@/lib/portal-token';
import { AnalyticsClient, type SiteWithStats } from './analytics-client';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function getSiteSlug(site: any): string {
  if (site.siteConfig?.slug) return site.siteConfig.slug;
  const cleanName = (site.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (cleanName.includes('cabana') || cleanName.includes('arbol')) return 'cabana-del-arbol';
  if (cleanName.includes('terraza')) return 'terrazas-bungalow';
  if (cleanName.includes('mendoza') || cleanName.includes('piscina') || cleanName.includes('cleaner')) return 'don-mendoza';
  return cleanName || `site-${site.id}`;
}

export default async function AnalyticsPage() {
  const [sites, events] = await Promise.all([
    dataService.getSites(),
    dataService.getAllSiteEvents(30),
  ]);

  const sitesWithStats: SiteWithStats[] = sites.map((s) => {
    const slug = getSiteSlug(s);
    const adminToken = createPortalToken(slug);

    return {
      id: s.id,
      name: s.name,
      slug,
      url: s.url || '',
      category: s.category || 'web_app',
      adminToken,
    };
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        title="Analítica y Telemetría en Vivo"
        subtitle="Monitoreo de tráfico, clics en WhatsApp y conversiones de toda la cartera de clientes."
      />

      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <AnalyticsClient sites={sitesWithStats} events={events} />
      </div>
    </div>
  );
}
