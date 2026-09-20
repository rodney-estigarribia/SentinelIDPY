import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { SiteDetailClient } from './site-detail-client';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 0;

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = await dataService.getSiteById(siteId);

  if (!site) {
    notFound();
  }

  const client = site.clientId ? await dataService.getClientById(site.clientId) : undefined;
  const templates = await dataService.getTemplates();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title={`Cockpit: ${site.name}`}
        subtitle={`${site.url} • Asignado a: ${client ? client.name : 'Sin cliente'}`}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <Link
          href="/sites"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al Directorio de Sitios</span>
        </Link>

        {/* Interactive Site Cockpit Client */}
        <SiteDetailClient site={site} client={client} templates={templates} />
      </div>
    </div>
  );
}
