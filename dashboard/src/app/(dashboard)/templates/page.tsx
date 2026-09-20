import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { TemplatesClient } from './templates-client';

export const revalidate = 0;

export default async function TemplatesPage() {
  const [templates, sites] = await Promise.all([
    dataService.getTemplates(),
    dataService.getSites({ type: 'wordpress' }),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Plantillas Doradas y Detección de Diferencias (Drift)"
        subtitle="Estandarización de configuraciones de plugins, comparativa en tiempo real y sincronización remota"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <TemplatesClient initialTemplates={templates} sites={sites} />
      </div>
    </div>
  );
}
