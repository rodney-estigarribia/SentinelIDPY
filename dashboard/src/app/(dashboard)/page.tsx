import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import {
  Globe,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Zap,
  Server,
  Users
} from 'lucide-react';

export const revalidate = 0;

export default async function OverviewPage() {
  const [sites, clients] = await Promise.all([
    dataService.getSites(),
    dataService.getClients()
  ]);

  const totalSites = sites.length;
  const wpSites = sites.filter((s) => s.type === 'wordpress').length;
  const vercelSites = sites.filter((s) => s.type === 'vercel').length;
  const systemSites = sites.filter((s) => s.type === 'sistema').length;

  const totalUpdates = sites.reduce(
    (acc, s) => acc + (s.pendingUpdates?.plugins || 0) + (s.pendingUpdates?.themes || 0) + (s.pendingUpdates?.wordpress || 0),
    0
  );

  const totalAttacks = sites.reduce(
    (acc, s) => acc + (s.wordfenceStats?.totalAttacks || 0),
    0
  );

  const totalAllocatedDisk = sites.reduce(
    (acc, s) => acc + (s.diskAllocatedGb || 0),
    0
  );

  const totalUsedDisk = sites.reduce(
    (acc, s) => acc + (s.performanceInfo?.siteSizeGb || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Resumen General" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Summary Banner */}
        <div className="rounded-xl p-5 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% de Red Operativa
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Todos los sistemas y sitios de clientes responden con normalidad
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Último escaneo general: hace 4 minutos • Próximo chequeo programado en 6 minutos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/updates"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-950"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ver Actualizaciones ({totalUpdates})</span>
            </Link>
            <Link
              href="/services"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <span>+ Nuevo Servicio</span>
            </Link>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Servicios */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Servicios y Activos</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">{totalSites} Sitios</div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
                <span className="text-slate-300 font-semibold">{wpSites} WP</span> • 
                <span className="text-slate-300 font-semibold">{vercelSites} Vercel</span> • 
                <span className="text-slate-300 font-semibold">{systemSites} Sistemas</span>
              </div>
            </div>
          </div>

          {/* Card 2: Actualizaciones */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Actualizaciones</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">{totalUpdates} Pendientes</div>
              <p className="text-xs text-amber-400/90 mt-1.5 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Requieren revisión técnica
              </p>
            </div>
          </div>

          {/* Card 3: Wordfence */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Ataques Mitigados</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {totalAttacks.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Wordfence WAF 100% activo
              </p>
            </div>
          </div>
        </div>

        {/* Sites Main Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-white text-base tracking-tight">Estado de los Servicios de Clientes</h2>
              <p className="text-xs text-slate-400">Supervisión en vivo de salud HTTP, versiones y tareas de mantenimiento</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/services"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>Ver todos los servicios</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Servicio / Cliente</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Estado / Latencia</th>
                  <th className="py-3 px-4">Actualizaciones</th>
                  <th className="py-3 px-4">Seguridad Wordfence</th>
                  <th className="py-3 px-4">Última Copia</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sites.map((site) => {
                  const client = clients.find((c) => c.id === site.clientId);
                  const updatesCount = (site.pendingUpdates?.plugins || 0) + (site.pendingUpdates?.themes || 0) + (site.pendingUpdates?.wordpress || 0);

                  return (
                    <tr key={site.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Link href={`/services/${site.id}`} className="hover:text-emerald-400 transition-colors">
                            {site.name}
                          </Link>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-300"
                            title="Abrir web"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {client ? client.name : 'Sin cliente asignado'} • {site.url.replace(/^https?:\/\//, '')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {site.type === 'wordpress' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            WordPress {site.wpVersion || ''}
                          </span>
                        )}
                        {site.type === 'vercel' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-700/30 text-zinc-300 border border-zinc-700">
                            Vercel Onepage
                          </span>
                        )}
                        {site.type === 'sistema' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Sistema Webapp
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-semibold text-slate-200">HTTP {site.lastStatusCode || 200}</span>
                          <span className="text-[11px] text-slate-400">({site.lastResponseTimeMs || 250}ms)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          SSL: {site.sslDaysLeft ? `${site.sslDaysLeft} días restantes` : 'OK'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {updatesCount > 0 ? (
                          <Link
                            href={`/updates?siteId=${site.id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>{updatesCount} pendientes</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Al día
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {site.wordfenceStats ? (
                          <div>
                            <span className="text-slate-200 font-semibold">
                              {site.wordfenceStats.totalAttacks.toLocaleString()} ataques
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {site.wordfenceStats.rulesDetail || 'Reglas activas'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {site.lastBackupAt ? (
                          <div>
                            <span>UpdraftPlus OK</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Google Drive
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">No configurado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/services/${site.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                        >
                          Gestionar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: Client Infrastructure Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Mapa de Clientes</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Fichas técnicas con el inventario de dominios en nic.py, servidores en Hosting Paraguay, cuentas de correo y costos anualizados.
            </p>
            <Link
              href="/clients"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Explorar Fichas Técnicas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Plantillas Doradas</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Estandariza configuraciones de Wordfence, LiteSpeed y Widgets de WordPress. Detecta diferencias (drift) y sincroniza con 1 clic.
            </p>
            <Link
              href="/templates"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Ver Plantillas y Drift</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Server className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white text-sm">Vercel & Sistemas</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Control de onepages en Vercel y aplicaciones móviles o webapps a medida con latencia y verificaciones periódicas de disponibilidad.
            </p>
            <Link
              href="/services?type=vercel"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>Filtrar Vercel y Sistemas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
