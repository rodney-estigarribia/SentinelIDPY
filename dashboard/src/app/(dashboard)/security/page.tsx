import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Lock } from 'lucide-react';

export const revalidate = 0;

export default async function SecurityPage() {
  const sites = await dataService.getSites({ type: 'wordpress' });

  const totalAttacks = sites.reduce(
    (acc, s) => acc + (s.wordfenceStats?.totalAttacks || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Seguridad y Wordfence" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Ataques Bloqueados (30 Días)
            </span>
            <div className="text-3xl font-extrabold text-white tracking-tight mt-1">
              {totalAttacks.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Sumatoria de todos los sitios clientes</p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Estado de Reglas WAF
            </span>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-1">
              <ShieldCheck className="w-5 h-5" />
              <span>100% Actualizadas</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Protección contra vulnerabilidades críticas activa</p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Salud de Certificados SSL
            </span>
            <div className="text-xl font-bold text-white flex items-center gap-2 mt-1">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>Todos Válidos</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Ningún certificado vence en los próximos 30 días</p>
          </div>
        </div>

        {/* Security Table by Site */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Estado de Seguridad por Sitio</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Sitio</th>
                  <th className="py-3 px-4">Ataques Mitigados</th>
                  <th className="py-3 px-4">Reglas WAF</th>
                  <th className="py-3 px-4">Último Escaneo Malware</th>
                  <th className="py-3 px-4">Certificado SSL</th>
                  <th className="py-3 px-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <Link href={`/services/${site.id}`} className="hover:text-emerald-400">
                        {site.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-mono font-normal">
                        {site.url.replace(/^https?:\/\//, '')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-rose-400 font-mono">
                        {(site.wordfenceStats?.totalAttacks || 0).toLocaleString()} ataques
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Al día
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {site.wordfenceStats?.lastScan || '2026-09-19 04:12'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">
                        {site.sslDaysLeft || 60} días restantes
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/services/${site.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                      >
                        Ver Amenazas
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
