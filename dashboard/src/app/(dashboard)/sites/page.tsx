import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import {
  Globe,
  Plus,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Server,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SitesTableClient } from './sites-table-client';

export const revalidate = 0;

export default async function SitesPage() {
  const [sites, clients] = await Promise.all([
    dataService.getSites(),
    dataService.getClients(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Servicios y Activos" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Client-Interactive Table with Type Tabs, Search, Filter and Add Site modal */}
        <SitesTableClient initialSites={sites} clients={clients} />
      </div>
    </div>
  );
}
