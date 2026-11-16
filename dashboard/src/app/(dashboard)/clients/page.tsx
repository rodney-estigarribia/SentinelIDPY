import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { ClientsClient } from './clients-client';

export const revalidate = 0;

export default async function ClientsPage() {
  const [clients, sites, projects, payments] = await Promise.all([
    dataService.getClients(),
    dataService.getSites(),
    dataService.getProjects(),
    dataService.getPayments(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Clientes e Infraestructura" />

      <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
        <ClientsClient
          initialClients={clients}
          sites={sites}
          initialProjects={projects}
          initialPayments={payments}
        />
      </div>
    </div>
  );
}
