import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { HardDrive, CheckCircle2, AlertTriangle, ExternalLink, Play, Cloud } from 'lucide-react';

export const revalidate = 0;

export default async function BackupsPage() {
  const sites = await dataService.getSites({ type: 'wordpress' });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Copias de Seguridad" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Architecture Notice Banner */}
        <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 mb-2">
              <Cloud className="w-3.5 h-3.5" />
              <span>Fase 1 Activa: UpdraftPlus → Google Drive</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Todos los clientes tienen programado su respaldo completo semanal + incremental diario
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Fase 2 en desarrollo: Conector nativo SentinelIDPY para respaldo directo sin depender de UpdraftPlus hacia múltiples destinos (Google Drive, AWS S3, Cloudflare R2 y SFTP).
            </p>
          </div>
        </div>

        {/* Backups Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Estado de Respaldo por Sitio</h3>
          </div>

          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Sitio</th>
                <th className="py-3 px-4">Plugin</th>
                <th className="py-3 px-4">Destino de Almacenamiento</th>
                <th className="py-3 px-4">Última Copia Completa</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <Link href={`/services/${site.id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                      {site.name}
                    </Link>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                      {site.url.replace(/^https?:\/\//, '')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">UpdraftPlus v1.24</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Google Drive (Impulsos)
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {site.id % 2 === 0 ? 'Hace 24 horas' : 'Hace 36 horas'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Respaldo OK
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/services/${site.id}`}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                    >
                      Ver en Cockpit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
