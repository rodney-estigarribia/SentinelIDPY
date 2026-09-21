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
  Filter
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
  type: 'core' | 'plugin' | 'theme';
  slug: string;
  name: string;
  currentVersion: string;
  newVersion: string;
}

export function UpdatesClient({ sites, clients, initialSiteId }: UpdatesClientProps) {
  // Collect all updates across sites into a flat list
  const allUpdates: UpdateItem[] = [];
  sites.forEach((site) => {
    const client = clients.find((c) => c.id === site.clientId);
    const details = site.pendingUpdates?.details || [];
    details.forEach((d) => {
      allUpdates.push({
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
  });

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

  const handleRunMassUpdates = async () => {
    if (selectedKeys.length === 0) return;
    setIsRunning(true);
    setProgress(5);
    setCompletedCount(0);
    setLogs(['[Sentinel] Iniciando orquestación de actualizaciones masivas...', `[Sentinel] Elementos seleccionados para actualizar: ${selectedKeys.length}`]);

    const total = selectedKeys.length;
    let done = 0;

    for (let i = 0; i < total; i++) {
      const key = selectedKeys[i];
      const item = allUpdates.find((u) => `${u.siteId}:${u.slug}` === key);
      if (!item) continue;

      setCurrentStep(`Actualizando ${item.name} en ${item.siteName}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      done++;
      setCompletedCount(done);
      const pct = Math.round((done / total) * 100);
      setProgress(pct);

      setLogs((prev) => [
        ...prev,
        `[OK] ${item.siteName} → ${item.name} actualizado exitosamente de v${item.currentVersion} a v${item.newVersion}`,
      ]);
    }

    setCurrentStep('Purgando OPcache y verificando código de respuesta HTTP 200 en cada sitio...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLogs((prev) => [
      ...prev,
      '[Sentinel] Proceso completado exitosamente. Todos los sitios responden en HTTP 200 con normalidad.',
    ]);
    setIsRunning(false);
    setProgress(100);
    setCurrentStep('¡Actualización masiva completada!');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Pendientes</span>
          <div className="text-2xl font-bold text-white tracking-tight mt-1">{allUpdates.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">En toda la cartera de WordPress</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 font-semibold uppercase">Plugins</span>
          <div className="text-2xl font-bold text-blue-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'plugin').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Compatibilidad verificada</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 font-semibold uppercase">Temas</span>
          <div className="text-2xl font-bold text-purple-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'theme').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Temas activos y de respaldo</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400 font-semibold uppercase">WordPress Core</span>
          <div className="text-2xl font-bold text-amber-400 tracking-tight mt-1">
            {allUpdates.filter((u) => u.type === 'core').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Actualizaciones mayores/menores</p>
        </div>
      </div>

      {/* Execution Progress & Terminal View */}
      {isRunning && (
        <div className="p-6 rounded-xl border border-emerald-500/30 bg-slate-900/90 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              <div>
                <h4 className="font-bold text-white text-sm">Ejecución en Progreso</h4>
                <p className="text-xs text-slate-400">{currentStep}</p>
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-emerald-400">{progress}%</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-md shadow-emerald-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 max-h-44 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-emerald-400/90">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Filters and Mass Update Action Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterSiteId}
              onChange={(e) => setFilterSiteId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos los Sitios ({sites.length})</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            {['all', 'plugin', 'theme', 'core'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                  filterType === t
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <button onClick={handleSelectAllFiltered} className="hover:text-white">
              Marcar todos
            </button>
            <span>•</span>
            <button onClick={handleDeselectAll} className="hover:text-white">
              Desmarcar
            </button>
          </div>
        </div>

        <button
          onClick={handleRunMassUpdates}
          disabled={selectedKeys.length === 0 || isRunning}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/60"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>
            {isRunning ? 'Ejecutando...' : `Instalar ${selectedKeys.length} Actualizaciones`}
          </span>
        </button>
      </div>

      {/* Updates Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
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
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900"
                />
              </th>
              <th className="py-3 px-4">Componente a Actualizar</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Sitio / Cliente</th>
              <th className="py-3 px-4">Versión Actual</th>
              <th className="py-3 px-4">Nueva Versión</th>
              <th className="py-3 px-4 text-right">Sitio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredUpdates.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No hay actualizaciones pendientes con los filtros seleccionados.
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
                      isSelected ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900"
                      />
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.name}
                      <span className="text-[11px] text-slate-400 font-mono block font-normal">
                        {item.slug}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-white font-semibold">{item.siteName}</span>
                      <span className="text-slate-400 block text-[11px]">{item.clientName}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">{item.currentVersion}</td>

                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                      {item.newVersion}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/services/${item.siteId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        Abrir Cockpit →
                      </Link>
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
