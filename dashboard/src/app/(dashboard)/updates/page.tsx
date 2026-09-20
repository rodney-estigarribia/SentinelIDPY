import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { UpdatesClient } from './updates-client';

export const revalidate = 0;

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const params = await searchParams;
  const targetSiteId = params.siteId ? parseInt(params.siteId, 10) : undefined;

  const [sites, clients] = await Promise.all([
    dataService.getSites({ type: 'wordpress' }),
    dataService.getClients(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Centro de Mando: Actualizaciones Masivas"
        subtitle="Supervisión global de WordPress Core, plugins y temas con ejecución en lote y progreso en tiempo real"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <UpdatesClient sites={sites} clients={clients} initialSiteId={targetSiteId} />
      </div>
    </div>
  );
}
