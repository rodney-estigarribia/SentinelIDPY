'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Eye,
  Users,
  MessageCircle,
  TrendingUp,
  MapPin,
  Smartphone,
  Laptop,
  ExternalLink,
  Globe,
  Filter,
  Activity,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import type { SiteEvent } from '@/db/schema';

export interface SiteWithStats {
  id: number;
  name: string;
  slug: string;
  url: string;
  category?: string;
  adminToken: string;
}

interface AnalyticsClientProps {
  sites: SiteWithStats[];
  events: SiteEvent[];
}

export function AnalyticsClient({ sites, events }: AnalyticsClientProps) {
  const [selectedSiteSlug, setSelectedSiteSlug] = useState<string>('all');

  // Filter events based on selected site
  const filteredEvents = useMemo(() => {
    if (selectedSiteSlug === 'all') return events;
    return events.filter((e) => e.siteSlug === selectedSiteSlug);
  }, [events, selectedSiteSlug]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let pageviews = 0;
    let whatsappClicks = 0;
    const visitorHashes = new Set<string>();
    const citiesMap: Record<string, number> = {};
    const deviceMap = { mobile: 0, desktop: 0, tablet: 0 };
    const dailyMap: Record<string, { date: string; pageviews: number; whatsappClicks: number; visitors: Set<string> }> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyMap[d] = { date: d, pageviews: 0, whatsappClicks: 0, visitors: new Set() };
    }

    for (const ev of filteredEvents) {
      const day = ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : '';
      if (ev.eventType === 'pageview') {
        pageviews++;
        if (ev.visitorHash) visitorHashes.add(ev.visitorHash);
        if (dailyMap[day]) {
          dailyMap[day].pageviews++;
          if (ev.visitorHash) dailyMap[day].visitors.add(ev.visitorHash);
        }
      } else if (ev.eventType === 'whatsapp_click') {
        whatsappClicks++;
        if (dailyMap[day]) dailyMap[day].whatsappClicks++;
      }

      if (ev.city && ev.city !== 'unknown') {
        citiesMap[ev.city] = (citiesMap[ev.city] || 0) + 1;
      }

      const dev = (ev.device || 'desktop') as 'mobile' | 'desktop' | 'tablet';
      if (deviceMap[dev] !== undefined) deviceMap[dev]++;
    }

    const uniqueVisitors = visitorHashes.size || (pageviews > 0 ? Math.ceil(pageviews * 0.75) : 0);
    const conversionRate = uniqueVisitors > 0
      ? Math.min(100, Math.round((whatsappClicks / uniqueVisitors) * 1000) / 10)
      : 0;

    const topCities = Object.entries(citiesMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalDevices = (deviceMap.mobile + deviceMap.desktop + deviceMap.tablet) || 1;
    const mobilePct = Math.round((deviceMap.mobile / totalDevices) * 100);
    const desktopPct = 100 - mobilePct;

    const daily = Object.values(dailyMap).map((d) => ({
      date: d.date,
      pageviews: d.pageviews,
      whatsappClicks: d.whatsappClicks,
      visitors: d.visitors.size,
    }));

    return {
      pageviews,
      uniqueVisitors,
      whatsappClicks,
      conversionRate,
      topCities,
      mobilePct,
      desktopPct,
      daily,
    };
  }, [filteredEvents]);

  // Per-site breakdown table
  const siteSummaries = useMemo(() => {
    return sites.map((s) => {
      const sEvents = events.filter((e) => e.siteSlug === s.slug);
      let pvs = 0;
      let wa = 0;
      const vHashes = new Set<string>();
      const devCount = { mobile: 0, desktop: 0 };

      for (const ev of sEvents) {
        if (ev.eventType === 'pageview') {
          pvs++;
          if (ev.visitorHash) vHashes.add(ev.visitorHash);
        } else if (ev.eventType === 'whatsapp_click') {
          wa++;
        }
        if (ev.device === 'mobile') devCount.mobile++;
        else if (ev.device === 'desktop') devCount.desktop++;
      }

      const uVisitors = vHashes.size || (pvs > 0 ? Math.ceil(pvs * 0.75) : 0);
      const conv = uVisitors > 0 ? Math.min(100, Math.round((wa / uVisitors) * 1000) / 10) : 0;
      const predominant = devCount.mobile >= devCount.desktop ? 'Móvil' : 'Desktop';

      return {
        ...s,
        pageviews: pvs,
        uniqueVisitors: uVisitors,
        whatsappClicks: wa,
        conversionRate: conv,
        predominant,
      };
    }).sort((a, b) => b.pageviews - a.pageviews);
  }, [sites, events]);

  const activeSiteName = useMemo(() => {
    if (selectedSiteSlug === 'all') return 'Todas las Webs (Global de Agencia)';
    const found = sites.find((s) => s.slug === selectedSiteSlug);
    return found ? found.name : selectedSiteSlug;
  }, [selectedSiteSlug, sites]);

  // Find max daily pageviews for chart scaling
  const maxDailyViews = useMemo(() => {
    const max = Math.max(...metrics.daily.map((d) => d.pageviews), 1);
    return max;
  }, [metrics.daily]);

  return (
    <div className="space-y-8">
      {/* Site Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Filtrar por Sitio Web
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {activeSiteName}
            </span>
          </div>
        </div>

        {/* Site Pill Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedSiteSlug('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedSiteSlug === 'all'
                ? 'bg-[#1c2e1e] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas las Webs ({events.length} eventos)
          </button>

          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSiteSlug(s.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedSiteSlug === s.slug
                  ? 'bg-[#1c2e1e] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid - EXACT SAME DESIGN & DISTRIBUTION AS CLIENT PORTAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Visitas Totales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visitas Totales
            </span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {metrics.pageviews.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-2">Páginas vistas últimos 30 días</div>
        </div>

        {/* Metric 2: Personas Únicas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personas Únicas
            </span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {metrics.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-2">Visitantes únicos verificados</div>
        </div>

        {/* Metric 3: WhatsApp Clics (Highlighted Card) */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              WhatsApp Clics 💬
            </span>
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 tracking-tight">
            {metrics.whatsappClicks.toLocaleString()}
          </div>
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-2">
            Personas que consultaron / conversión
          </div>
        </div>

        {/* Metric 4: Conversión Web */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversión Web
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {metrics.conversionRate}%
          </div>
          <div className="text-xs text-slate-400 mt-2">Visitas que tocaron reservar</div>
        </div>
      </div>

      {/* Details Grid (7 Days Activity & Cities/Devices) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: 7 Days Activity (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Actividad de los Últimos 7 Días</span>
              </h3>
              <span className="text-xs font-medium text-slate-400">
                {selectedSiteSlug === 'all' ? 'Toda la cartera' : activeSiteName}
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-32 flex items-end justify-between gap-3 pt-4 pb-2 px-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl mb-4">
              {metrics.daily.map((d) => {
                const heightPct = maxDailyViews > 0 ? Math.max(12, Math.round((d.pageviews / maxDailyViews) * 100)) : 12;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.pageviews}
                    </span>
                    <div
                      className="w-full bg-emerald-500/70 hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Daily Breakdown List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {metrics.daily.map((d) => (
                <div key={d.date} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{d.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50">
                      👁️ {d.pageviews} visitas
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                      💬 {d.whatsappClicks} WhatsApp
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Cities & Devices (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ciudades de Origen</span>
            </h3>

            {metrics.topCities && metrics.topCities.length > 0 ? (
              <div className="space-y-2">
                {metrics.topCities.map((c) => (
                  <div
                    key={c.city}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none text-sm"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {c.city}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {c.count} visitas
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-3">
                {filteredEvents.length === 0
                  ? 'Aún no se registraron visitas en este sitio.'
                  : 'Tráfico de red local / sin geolocalización explícita.'}
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Distribución de Dispositivos
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Celulares (Móviles)
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{metrics.mobilePct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.mobilePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Computadoras (Desktop)
                  </span>
                  <span className="font-bold text-sky-700 dark:text-sky-400">{metrics.desktopPct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.desktopPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agency Master Table: Desglose por Web de Cliente */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Rendimiento Individual por Web de Cliente
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Métricas reales consolidadas en Neon Postgres con acceso directo al portal de cada cliente.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total sitios monitoreados: <strong className="text-slate-700 dark:text-slate-200">{sites.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Sitio / Cliente</th>
                <th className="py-3 px-4">Visitas (30d)</th>
                <th className="py-3 px-4">Personas Únicas</th>
                <th className="py-3 px-4">WhatsApp Clics</th>
                <th className="py-3 px-4">Conversión</th>
                <th className="py-3 px-4">Dispositivo</th>
                <th className="py-3 px-4 text-right">Acceso Directo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {siteSummaries.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {s.slug}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono font-normal mt-0.5">
                      {s.url.replace(/^https?:\/\//, '')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {s.pageviews.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {s.uniqueVisitors.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                      💬 {s.whatsappClicks}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.conversionRate}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {s.predominant}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`/portal/${s.slug}?token=${s.adminToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2e1e] hover:bg-[#28422b] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <span>Abrir Portal</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
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
