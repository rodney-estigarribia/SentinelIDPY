import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { ClientsClient } from './clients-client';

export const revalidate = 0;

export default async function ClientsPage() {
  const [clients, sites] = await Promise.all([
    dataService.getClients(),
    dataService.getSites(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Clientes y Mapa de Infraestructura"
        subtitle="Inventario de activos, dominios en nic.py, hosting, DNS, correos corporativos y valorización anual"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <ClientsClient initialClients={clients} sites={sites} />
      </div>
    </div>
  );
}
