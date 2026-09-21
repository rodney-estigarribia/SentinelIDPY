import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { SiteDetailClient } from '@/app/(dashboard)/sites/[id]/site-detail-client';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 0;

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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title={service.name} />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a Servicios y Activos</span>
        </Link>

        {/* Interactive Service Cockpit Client */}
        <SiteDetailClient site={service} client={client} templates={templates} />
      </div>
    </div>
  );
}
