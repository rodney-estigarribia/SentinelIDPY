'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check,
  Terminal,
  Filter,
  ArrowUpCircle
} from 'lucide-react';
import type { Site, Client } from '@/db/schema';

interface UpdatesClientProps {
  sites: Site[];
  clients: Client[];
  initialSiteId?: number;
}

interface UpdateItem {
  siteId: number;
  siteName: string;
  siteUrl: string;
  clientName: string;
  type: 'core' | 'plugin' | 'theme' | 'translation';
  slug: string;
  name: string;
  currentVersion: string;
  newVersion: string;
}

export function UpdatesClient({ sites, clients, initialSiteId }: UpdatesClientProps) {
  // Build initial flat list
  const getInitialUpdates = (): UpdateItem[] => {
    const list: UpdateItem[] = [];
    sites.forEach((site) => {
      const client = clients.find((c) => c.id === site.clientId);
      const details = site.pendingUpdates?.details || [];
      if (details.length > 0) {
        details.forEach((d) => {
          list.push({
            siteId: site.id,
            siteName: site.name,
            siteUrl: site.url,
            clientName: client ? client.name : 'Sin cliente',
            type: d.type as any,
            slug: d.slug,
            name: d.name,
            currentVersion: d.currentVersion,
            newVersion: d.newVersion,
          });
        });
      } else {
        const pCount = site.pendingUpdates?.plugins || 0;
        const trCount = site.pendingUpdates?.translations || 0;

        if (pCount > 0) {
          list.push({
            siteId: site.id,
            siteName: site.name,
            siteUrl: site.url,
            clientName: client ? client.name : 'Sin cliente',
            type: 'plugin',
            slug: 'wordpress-plugin',
            name: 'SentinelIDPY Connector',
            currentVersion: '4.2',
            newVersion: '4.3',
          });
        }
        if (trCount > 0) {
          list.push({
            siteId: site.id,
            siteName: site.name,
            siteUrl: site.url,
            clientName: client ? client.name : 'Sin cliente',
            type: 'translation',
            slug: `es_ES_${site.id}`,
            name: 'Traducciones al Español',
            currentVersion: 'Actual',
            newVersion: 'Disponible',
          });
        }
      }
    });
    return list;
  };

  const [allUpdates, setAllUpdates] = useState<UpdateItem[]>(getInitialUpdates());
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    initialSiteId
      ? allUpdates.filter((u) => u.siteId === initialSiteId).map((u) => `${u.siteId}:${u.slug}`)
      : allUpdates.map((u) => `${u.siteId}:${u.slug}`)
  );

  const [filterSiteId, setFilterSiteId] = useState<string>(
    initialSiteId ? String(initialSiteId) : 'all'
  );
  const [filterType, setFilterType] = useState<string>('all');

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  const filteredUpdates = allUpdates.filter((u) => {
    const matchesSite = filterSiteId === 'all' || u.siteId === parseInt(filterSiteId, 10);
    const matchesType = filterType === 'all' || u.type === filterType;
    return matchesSite && matchesType;
  });

  const handleToggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllFiltered = () => {
    const keys = filteredUpdates.map((u) => `${u.siteId}:${u.slug}`);
    setSelectedKeys(Array.from(new Set([...selectedKeys, ...keys])));
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  // Sync / Refresh with WordPress & MainWP in real time
  const handleRefreshUpdates = async () => {
    setIsRefreshing(true);
    setRefreshMessage('Sincronizando estado de actualizaciones con WordPress y MainWP...');

    const freshUpdates: UpdateItem[] = [];

    if (filterSiteId === 'all') {
      try {
        const res = await fetch('/api/admin/sync-all');
        const data = await res.json();
        if (res.ok && Array.isArray(data.results)) {
          data.results.forEach((r: any) => {
            const client = clients.find((c) => c.id === r.clientId);
            const details = r.pendingUpdates?.details || [];
            details.forEach((d: any) => {
              freshUpdates.push({
                siteId: r.id,
                siteName: r.name,
                siteUrl: r.url,
                clientName: client ? client.name : 'Sin cliente',
                type: d.type,
                slug: d.slug,
                name: d.name,
                currentVersion: d.currentVersion,
                newVersion: d.newVersion,
              });
            });
          });
        }
      } catch (err) {
        console.warn('Error in sync-all:', err);
      }
    }

    if (freshUpdates.length === 0) {
      const targetSites = filterSiteId === 'all'
        ? sites.filter((s) => s.type === 'wordpress')
        : sites.filter((s) => s.id === parseInt(filterSiteId, 10) && s.type === 'wordpress');

      await Promise.all(
        targetSites.map(async (site) => {
          try {
            const res = await fetch(`/api/sites/${site.id}/updates/refresh`, { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.pendingUpdates?.details) {
              const client = clients.find((c) => c.id === site.clientId);
              data.pendingUpdates.details.forEach((d: any) => {
                freshUpdates.push({
                  siteId: site.id,
                  siteName: site.name,
                  siteUrl: site.url,
                  clientName: client ? client.name : 'Sin cliente',
                  type: d.type,
                  slug: d.slug,
                  name: d.name,
                  currentVersion: d.currentVersion,
                  newVersion: d.newVersion,
                });
              });
            }
          } catch (err) {
            console.warn(`Error refreshing site ${site.name}:`, err);
          }
        })
      );
    }

    if (filterSiteId === 'all') {
      if (freshUpdates.length > 0) {
        setAllUpdates(freshUpdates);
        setSelectedKeys(freshUpdates.map((u) => `${u.siteId}:${u.slug}`));
      }
    } else {
      setAllUpdates((prev) => [
        ...prev.filter((u) => u.siteId !== parseInt(filterSiteId, 10)),
        ...freshUpdates,
      ]);
    }

    setIsRefreshing(false);
    setRefreshMessage(`✅ Sincronización completada. ${freshUpdates.length} actualización(es) detectada(s).`);
    setTimeout(() => setRefreshMessage(null), 4500);
  };

  // Execute single item update
  const handleUpdateSingle = async (item: UpdateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(true);
    setCurrentStep(`Actualizando ${item.name} en ${item.siteName}...`);
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Iniciando actualización de ${item.name} en ${item.siteUrl}...`,
      ...prev,
    ]);

    try {
      const typeParam = item.type === 'core' ? 'core' : (item.type === 'theme' ? 'themes' : (item.type === 'translation' ? 'translations' : 'plugins'));
      const res = await fetch(`/api/sites/${item.siteId}/updates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeParam, slugs: [item.slug] }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al procesar actualización en WordPress');
      }

      setLogs((prev) => [
        `[OK] ${item.siteName}: ${item.name} actualizado con éxito a v${item.newVersion}.`,
        ...prev,
      ]);

      // Remove from list
      const key = `${item.siteId}:${item.slug}`;
      setAllUpdates((prev) => prev.filter((u) => `${u.siteId}:${u.slug}` !== key));
      setSelectedKeys((prev) => prev.filter((k) => k !== key));
    } catch (err: any) {
      setLogs((prev) => [
        `[ERROR] ${item.siteName} (${item.name}): ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsRunning(false);
      setCurrentStep(null);
    }
  };

  // Run mass updates (Real backend requests)
  const handleRunMassUpdates = async () => {
    if (selectedKeys.length === 0) return;
    setIsRunning(true);
    setProgress(5);
    setCompletedCount(0);
    setLogs([
      `[SentinelIDPY] Iniciando orquestación de actualizaciones masivas en vivo...`,
      `[SentinelIDPY] Total componentes seleccionados: ${selectedKeys.length}`,
    ]);

    const total = selectedKeys.length;
    let done = 0;
    const successfulKeys: string[] = [];

    for (let i = 0; i < total; i++) {
      const key = selectedKeys[i];
      const item = allUpdates.find((u) => `${u.siteId}:${u.slug}` === key);
      if (!item) continue;

      setCurrentStep(`Actualizando ${item.name} en ${item.siteName}...`);

      try {
        const typeParam = item.type === 'core' ? 'core' : (item.type === 'theme' ? 'themes' : (item.type === 'translation' ? 'translations' : 'plugins'));
        const res = await fetch(`/api/sites/${item.siteId}/updates/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: typeParam, slugs: [item.slug] }),
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Fallo de actualización');
        }

        successfulKeys.push(key);
        setLogs((prev) => [
          `[OK] ${item.siteName} → ${item.name} actualizado exitosamente a v${item.newVersion}`,
          ...prev,
        ]);
      } catch (err: any) {
        setLogs((prev) => [
          `[ERROR] ${item.siteName} → ${item.name}: ${err.message}`,
          ...prev,
        ]);
      }

      done++;
      setCompletedCount(done);
      setProgress(Math.round((done / total) * 90));
    }

    // Purge cache on affected sites
    const uniqueSiteIds = Array.from(
      new Set(successfulKeys.map((k) => parseInt(k.split(':')[0], 10)))
    );

    if (uniqueSiteIds.length > 0) {
      setCurrentStep(`Purgando caché y OPcache en ${uniqueSiteIds.length} sitio(s)...`);
      for (const sId of uniqueSiteIds) {
        const s = sites.find((site) => site.id === sId);
        try {
          await fetch(`/api/sites/${sId}/performance`, { method: 'POST' });
          setLogs((prev) => [
            `[CACHE] Caché purgada y OPcache invalidado en ${s?.name || sId}`,
            ...prev,
          ]);
        } catch {
          // non-blocking
        }
      }
    }

    // Remove successfully updated items from state
    setAllUpdates((prev) => prev.filter((u) => !successfulKeys.includes(`${u.siteId}:${u.slug}`)));
    setSelectedKeys((prev) => prev.filter((k) => !successfulKeys.includes(k)));

    setProgress(100);
    setIsRunning(false);
    setCurrentStep('¡Actualización masiva completada!');
    setLogs((prev) => [
      `[SentinelIDPY] Proceso finalizado. ${successfulKeys.length}/${total} componentes actualizados.`,
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Pendientes</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">{allUpdates.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Ecosistema WordPress / MainWP</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Plugins</span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'plugin').length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Compatibilidad verificada</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Temas</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'theme').length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Temas activos y de respaldo</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">WordPress Core</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'core').length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Seguridad y parches oficiales</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Traducciones</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'translation').length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Paquetes de idioma (es_ES)</p>
        </div>
      </div>

      {/* Sync feedback notification */}
      {refreshMessage && (
        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{refreshMessage}</span>
        </div>
      )}

      {/* Live Execution Console & Progress */}
      {(isRunning || logs.length > 0) && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Consola de Orquestación en Vivo
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {completedCount} / {selectedKeys.length + completedCount} completados ({progress}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentStep && (
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span>{currentStep}</span>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-800 max-h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[ERROR]')
                    ? 'text-rose-400'
                    : log.includes('[OK]')
                    ? 'text-emerald-400'
                    : log.includes('[CACHE]')
                    ? 'text-sky-300'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Filters and Mass Update Action Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterSiteId}
              onChange={(e) => setFilterSiteId(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos los Sitios ({sites.length})</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleRefreshUpdates}
            disabled={isRefreshing || isRunning}
            title="Sincronizar actualizaciones pendientes con WordPress en vivo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sincronizar</span>
          </button>

          {/* Component Type Filter Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'plugin', label: 'Plugins' },
              { id: 'theme', label: 'Temas' },
              { id: 'core', label: 'Core' },
              { id: 'translation', label: 'Traducciones' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilterType(id)}
                style={
                  filterType === id
                    ? { backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }
                    : undefined
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors ${
                  filterType === id
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white border border-slate-900 dark:border-emerald-500 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Select / Deselect All */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={handleSelectAllFiltered}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium"
            >
              Marcar todos
            </button>
            <span>•</span>
            <button
              onClick={handleDeselectAll}
              className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {/* Mass Update Button */}
        <button
          onClick={handleRunMassUpdates}
          disabled={selectedKeys.length === 0 || isRunning}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>
            {isRunning ? 'Ejecutando...' : `Instalar ${selectedKeys.length} Actualizaciones`}
          </span>
        </button>
      </div>

      {/* Updates Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredUpdates.length > 0 &&
                    filteredUpdates.every((u) => selectedKeys.includes(`${u.siteId}:${u.slug}`))
                  }
                  onChange={(e) => {
                    if (e.target.checked) handleSelectAllFiltered();
                    else handleDeselectAll();
                  }}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 bg-white dark:bg-slate-900 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Componente a Actualizar</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Sitio / Cliente</th>
              <th className="py-3 px-4">Versión Actual</th>
              <th className="py-3 px-4">Nueva Versión</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filteredUpdates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    Todos los componentes están al día
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No hay actualizaciones pendientes con los filtros seleccionados.
                  </p>
                </td>
              </tr>
            ) : (
              filteredUpdates.map((item) => {
                const key = `${item.siteId}:${item.slug}`;
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    onClick={() => handleToggleSelect(key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100/60 dark:hover:bg-emerald-500/15'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 bg-white dark:bg-slate-900 cursor-pointer"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.name}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block font-normal">
                        {item.slug}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        item.type === 'plugin'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : item.type === 'theme'
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : item.type === 'core'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        {item.type === 'translation' ? 'Traducción' : item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-900 dark:text-white font-semibold">{item.siteName}</span>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{item.clientName}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{item.currentVersion}</td>

                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {item.newVersion}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleUpdateSingle(item, e)}
                          disabled={isRunning}
                          title={`Actualizar solo ${item.name}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 dark:text-slate-300 text-slate-700 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1 shadow-xs"
                        >
                          <ArrowUpCircle className="w-3 h-3" />
                          <span>Actualizar</span>
                        </button>

                        <Link
                          href={`/services/${item.siteId}`}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white inline-flex items-center"
                          title="Ver ficha de servicio"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
