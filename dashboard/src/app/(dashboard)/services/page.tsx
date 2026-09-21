import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { ServicesTableClient } from './services-table-client';

export const revalidate = 0;

export default async function ServicesPage() {
  const [services, clients] = await Promise.all([
    dataService.getServices(),
    dataService.getClients(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Servicios y Activos" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Dynamic Services Catalog with Systems, Categories, Relational dependencies & Billing attribution */}
        <ServicesTableClient initialSites={services} clients={clients} />
      </div>
    </div>
  );
}
