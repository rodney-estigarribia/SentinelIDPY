'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Plus,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Server,
  X,
  Lock
} from 'lucide-react';
import type { Site, Client } from '@/db/schema';

interface SitesTableClientProps {
  initialSites: Site[];
  clients: Client[];
}

export function SitesTableClient({ initialSites, clients }: SitesTableClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Site Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'wordpress' | 'vercel' | 'sistema'>('wordpress');
  const [formUrl, setFormUrl] = useState('');
  const [formToken, setFormToken] = useState('');
  const [formClientId, setFormClientId] = useState<number>(clients[0]?.id || 1);
  const [formDisk, setFormDisk] = useState('2.0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.url.toLowerCase().includes(search.toLowerCase());
    const matchesClient =
      selectedClient === 'all' || site.clientId === parseInt(selectedClient, 10);
    return matchesSearch && matchesClient;
  });

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          type: formType,
          url: formUrl,
          token: formToken,
          clientId: Number(formClientId),
          diskAllocatedGb: parseFloat(formDisk) || 0,
        }),
      });

      if (res.ok) {
        const createdSite = await res.json();
        setSites([createdSite, ...sites]);
        setIsModalOpen(false);
        // Reset form
        setFormName('');
        setFormUrl('');
        setFormToken('');
      } else {
        alert('Error al crear el sitio');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el sitio "${name}"?`)) return;

    try {
      const res = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSites(sites.filter((s) => s.id !== id));
      } else {
        alert('Error al eliminar');
      }
    } catch (err) {
      alert('Error de red');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Client Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o dominio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Todos los Clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-950/50"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Nuevo Sitio</span>
        </button>
      </div>

      {/* Sites Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Sitio / URL</th>
                <th className="py-3 px-4">Cliente Asignado</th>
                <th className="py-3 px-4">Plataforma</th>
                <th className="py-3 px-4">Uptime / Latencia</th>
                <th className="py-3 px-4">Actualizaciones</th>
                <th className="py-3 px-4">Disco Asignado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron sitios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => {
                  const client = clients.find((c) => c.id === site.clientId);
                  const updatesCount =
                    (site.pendingUpdates?.plugins || 0) +
                    (site.pendingUpdates?.themes || 0) +
                    (site.pendingUpdates?.wordpress || 0);

                  return (
                    <tr key={site.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Link
                            href={`/sites/${site.id}`}
                            className="hover:text-emerald-400 transition-colors text-sm"
                          >
                            {site.name}
                          </Link>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-300"
                            title="Abrir web en pestaña nueva"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {site.url}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {client ? (
                          <Link
                            href={`/clients#client-${client.id}`}
                            className="hover:text-emerald-400 transition-colors"
                          >
                            {client.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Sin cliente</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {site.type === 'wordpress' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            WordPress {site.wpVersion || ''}
                          </span>
                        )}
                        {site.type === 'vercel' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-700/30 text-zinc-300 border border-zinc-700">
                            Vercel Onepage
                          </span>
                        )}
                        {site.type === 'sistema' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Sistema Webapp
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-semibold text-slate-200">
                            HTTP {site.lastStatusCode || 200}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({site.lastResponseTimeMs || 250}ms)
                          </span>
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
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Al día
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {site.diskAllocatedGb ? `${site.diskAllocatedGb} GB` : 'Ilimitado / N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/sites/${site.id}`}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                          >
                            Administrar
                          </Link>
                          <button
                            onClick={() => handleDeleteSite(site.id, site.name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar sitio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add New Site Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Añadir Nuevo Sitio o Activo</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSite} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Sitio</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Tienda CGA, Landing Dagda"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plataforma</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="wordpress">WordPress</option>
                    <option value="vercel">Vercel Onepage</option>
                    <option value="sistema">Sistema / App</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cliente Asignado</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Completa</label>
                <input
                  type="url"
                  required
                  placeholder="https://ejemplo.com.py"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {formType === 'wordpress' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Token de Seguridad SentinelIDPY (Connector)</span>
                    <span className="text-[10px] text-slate-400">Mínimo 32 caracteres</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pegar token de Configuración → SentinelIDPY del cliente"
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Espacio Asignado en Hosting (GB)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ej. 2.5"
                  value={formDisk}
                  onChange={(e) => setFormDisk(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar y Conectar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
