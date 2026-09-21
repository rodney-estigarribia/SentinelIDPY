import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { TeamClient } from './team-client';

export const revalidate = 0;

export default async function TeamPage() {
  const clients = await dataService.getClients();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Equipo Virtual & Copys Rápidos" />

      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        <TeamClient clients={clients} />
      </div>
    </div>
  );
}
