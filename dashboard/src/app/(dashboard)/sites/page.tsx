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

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; clientId?: string }>;
}) {
  const params = await searchParams;
  const [sites, clients] = await Promise.all([
    dataService.getSites({
      type: params.type,
      clientId: params.clientId ? parseInt(params.clientId, 10) : undefined,
    }),
    dataService.getClients(),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Directorio de Sitios y Activos"
        subtitle="Administración integral de webs WordPress, onepages en Vercel y sistemas a medida"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Filter and Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Type Filters */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
            <Link
              href="/sites"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                !params.type
                  ? 'bg-slate-800 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({sites.length})
            </Link>
            <Link
              href="/sites?type=wordpress"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                params.type === 'wordpress'
                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              WordPress
            </Link>
            <Link
              href="/sites?type=vercel"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                params.type === 'vercel'
                  ? 'bg-zinc-700/50 text-white font-bold border border-zinc-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vercel Onepages
            </Link>
            <Link
              href="/sites?type=sistema"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                params.type === 'sistema'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sistemas / Apps
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/updates"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ver Actualizaciones</span>
            </Link>
          </div>
        </div>

        {/* Client-Interactive Table with Add Site modal */}
        <SitesTableClient initialSites={sites} clients={clients} />
      </div>
    </div>
  );
}
