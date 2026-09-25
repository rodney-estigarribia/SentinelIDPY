import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { createPortalToken } from '@/lib/portal-token';
import { SiteDetailClient } from '@/app/(dashboard)/sites/[id]/site-detail-client';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

function getSiteSlug(service: any): string {
  if (service.siteConfig?.slug) return service.siteConfig.slug;
  const cleanName = (service.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (cleanName.includes('cabana') || cleanName.includes('arbol')) return 'cabana-del-arbol';
  if (cleanName.includes('terraza')) return 'terrazas-bungalow';
  if (cleanName.includes('mendoza') || cleanName.includes('piscina') || cleanName.includes('cleaner')) return 'don-mendoza';
  return cleanName || `site-${service.id}`;
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceId = parseInt(id, 10);
  const service = await dataService.getServiceById(serviceId);

  if (!service) {
    notFound();
  }

  const client = service.clientId ? await dataService.getClientById(service.clientId) : undefined;
  const templates = await dataService.getTemplates();

  const slug = getSiteSlug(service);
  const events = await dataService.getSiteEvents(slug, 30);
  const adminToken = createPortalToken(slug);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Header title={service.name} subtitle="Cockpit de Gestión y Telemetría del Activo Digital" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a Servicios y Activos</span>
        </Link>

        {/* Interactive Service Cockpit Client */}
        <SiteDetailClient
          site={service}
          client={client}
          templates={templates}
          events={events}
          adminToken={adminToken}
          slug={slug}
        />
      </div>
    </div>
  );
}
