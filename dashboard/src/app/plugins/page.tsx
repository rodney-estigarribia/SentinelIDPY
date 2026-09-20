import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { PluginsClient } from './plugins-client';

export const revalidate = 0;

export default async function PluginsPage() {
  const sites = await dataService.getSites({ type: 'wordpress' });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gestor de Plugins y Temas Multi-Sitio"
        subtitle="Instala plugins desde WordPress.org o mediante archivo ZIP en uno o varios sitios de clientes en simultáneo"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <PluginsClient sites={sites} />
      </div>
    </div>
  );
}
