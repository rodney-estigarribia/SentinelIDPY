import React from 'react';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { BarChart3, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function AnalyticsPage() {
  const sites = await dataService.getSites();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Analítica (6 Meses)" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Summary Banner */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Arquitectura de Analítica Ultraligera</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Los hits de visitas se registran de forma aislada en la base de datos de cada cliente WordPress en la tabla{' '}
              <code className="bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-cyan-700 dark:text-cyan-400 font-mono border border-slate-200 dark:border-slate-800">wp_sentinel_analytics</code> con limpieza automática semestral. Tu panel central solo consulta resúmenes consolidados, protegiendo al 100% el límite gratuito de Vercel y Neon.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Visitas (Semestre)</span>
            <span className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">124,580</span>
          </div>
        </div>

        {/* Global Trend Chart */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tendencia Global de Audiencia (Abril - Septiembre)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Visitas combinadas en todos los sitios de la cartera</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>+28.4% Crecimiento Semestral</span>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-4 pt-8 px-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
            {[
              { month: 'Abril', visits: '14,200', height: '42%' },
              { month: 'Mayo', visits: '16,850', height: '52%' },
              { month: 'Junio', visits: '19,300', height: '64%' },
              { month: 'Julio', visits: '21,400', height: '72%' },
              { month: 'Agosto', visits: '24,650', height: '84%' },
              { month: 'Septiembre', visits: '28,180', height: '96%' },
            ].map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                  {m.visits}
                </span>
                <div
                  className="w-full bg-cyan-500/40 dark:bg-cyan-500/30 hover:bg-cyan-500/70 border border-cyan-500/50 rounded-t-md transition-all duration-300"
                  style={{ height: m.height }}
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sites Traffic Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Desglose por Sitio</h4>
          </div>

          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Sitio</th>
                <th className="py-3 px-4">Visitas (Último Mes)</th>
                <th className="py-3 px-4">Tasa de Rebote Estimada</th>
                <th className="py-3 px-4">Dispositivos Principales</th>
                <th className="py-3 px-4 text-right">Detalle Completo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <Link href={`/services/${site.id}`} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                      {site.name}
                    </Link>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                      {site.url.replace(/^https?:\/\//, '')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {site.id === 1 ? '4,280' : site.id === 2 ? '3,120' : site.id === 4 ? '5,420' : '1,890'} visitas
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-slate-700 dark:text-slate-200">
                      {site.id % 2 === 0 ? '42%' : '38%'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    Móvil: 70% • Desktop: 30%
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/services/${site.id}`}
                      className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold"
                    >
                      Ver en Cockpit →
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
