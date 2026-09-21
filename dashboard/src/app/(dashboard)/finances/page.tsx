import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { FinancesClient } from './finances-client';

export const revalidate = 0;

export default async function FinancesPage() {
  const [payments, clients, projects, settings] = await Promise.all([
    dataService.getPayments(),
    dataService.getClients(),
    dataService.getProjects(),
    dataService.getFinancialSettings(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Finanzas & Objetivos" />

      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <FinancesClient
          initialPayments={payments}
          clients={clients}
          projects={projects}
          initialSettings={settings}
        />
      </div>
    </div>
  );
}
