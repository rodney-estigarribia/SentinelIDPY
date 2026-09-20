'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Globe,
  Server,
  Mail,
  Compass,
  DollarSign,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  FileText,
  X
} from 'lucide-react';
import type { Client, Site } from '@/db/schema';

interface ClientsClientProps {
  initialClients: Client[];
  sites: Site[];
}

export function ClientsClient({ initialClients, sites }: ClientsClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Form states for Infrastructure
  const [domainProvider, setDomainProvider] = useState(selectedClient?.infrastructure?.domain?.provider || 'nic.py');
  const [domainRenewer, setDomainRenewer] = useState<'agency' | 'client'>(
    selectedClient?.infrastructure?.domain?.renewer || 'agency'
  );
  const [domainExpiry, setDomainExpiry] = useState(selectedClient?.infrastructure?.domain?.expiryDate || '2026-12-31');
  const [domainCost, setDomainCost] = useState(selectedClient?.infrastructure?.domain?.annualCost || 150000);
  const [domainCurrency, setDomainCurrency] = useState(selectedClient?.infrastructure?.domain?.currency || 'PYG');

  const [hostingProvider, setHostingProvider] = useState(
    selectedClient?.infrastructure?.hosting?.provider || 'Hosting Paraguay (cPanel)'
  );
  const [hostingPlan, setHostingPlan] = useState(selectedClient?.infrastructure?.hosting?.plan || 'Shared Business 10GB');
  const [hostingCost, setHostingCost] = useState(selectedClient?.infrastructure?.hosting?.annualCost || 450000);
  const [hostingCurrency, setHostingCurrency] = useState(selectedClient?.infrastructure?.hosting?.currency || 'PYG');

  const [dnsProvider, setDnsProvider] = useState(selectedClient?.infrastructure?.dns?.provider || 'cPanel Host');
  const [emailProvider, setEmailProvider] = useState(selectedClient?.infrastructure?.email?.provider || 'Google Workspace');
  const [emailAccounts, setEmailAccounts] = useState(selectedClient?.infrastructure?.email?.accountsCount || 5);
  const [emailCost, setEmailCost] = useState(selectedClient?.infrastructure?.email?.annualCost || 360);
  const [emailCurrency, setEmailCurrency] = useState(selectedClient?.infrastructure?.email?.currency || 'USD');

  // New client basic state
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const clientSites = selectedClient
    ? sites.filter((s) => s.clientId === selectedClient.id)
    : [];

  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    setDomainProvider(c.infrastructure?.domain?.provider || 'nic.py');
    setDomainRenewer(c.infrastructure?.domain?.renewer || 'agency');
    setDomainExpiry(c.infrastructure?.domain?.expiryDate || '2026-12-31');
    setDomainCost(c.infrastructure?.domain?.annualCost || 150000);
    setDomainCurrency(c.infrastructure?.domain?.currency || 'PYG');

    setHostingProvider(c.infrastructure?.hosting?.provider || 'Hosting Paraguay (cPanel)');
    setHostingPlan(c.infrastructure?.hosting?.plan || 'Shared Business 10GB');
    setHostingCost(c.infrastructure?.hosting?.annualCost || 450000);
    setHostingCurrency(c.infrastructure?.hosting?.currency || 'PYG');

    setDnsProvider(c.infrastructure?.dns?.provider || 'cPanel Host');
    setEmailProvider(c.infrastructure?.email?.provider || 'Google Workspace');
    setEmailAccounts(c.infrastructure?.email?.accountsCount || 5);
    setEmailCost(c.infrastructure?.email?.annualCost || 360);
    setEmailCurrency(c.infrastructure?.email?.currency || 'USD');
  };

  const handleSaveInfrastructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const updatedInfrastructure = {
      domain: {
        provider: domainProvider,
        renewer: domainRenewer,
        expiryDate: domainExpiry,
        annualCost: Number(domainCost),
        currency: domainCurrency,
      },
      hosting: {
        provider: hostingProvider,
        plan: hostingPlan,
        annualCost: Number(hostingCost),
        currency: hostingCurrency,
      },
      dns: {
        provider: dnsProvider,
      },
      email: {
        provider: emailProvider,
        accountsCount: Number(emailAccounts),
        annualCost: Number(emailCost),
        currency: emailCurrency,
      },
      systems: selectedClient.infrastructure?.systems || [],
    };

    const updatedClient = {
      ...selectedClient,
      infrastructure: updatedInfrastructure,
    };

    setClients((prev) =>
      prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
    );
    setSelectedClient(updatedClient);
    setIsEditModalOpen(false);
    alert('✅ Mapa de infraestructura actualizado con éxito para ' + selectedClient.name);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: Math.max(0, ...clients.map((c) => c.id)) + 1,
      name: newClientName,
      company: newClientCompany,
      email: newClientEmail,
      phone: newClientPhone,
      notes: '',
      infrastructure: {
        domain: { provider: 'nic.py', renewer: 'agency', annualCost: 150000, currency: 'PYG' },
        hosting: { provider: 'Hosting Paraguay', plan: 'Shared 5GB', annualCost: 450000, currency: 'PYG' },
        dns: { provider: 'cPanel Host' },
        email: { provider: 'Google Workspace', accountsCount: 3, annualCost: 216, currency: 'USD' }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setClients([...clients, newClient]);
    setSelectedClient(newClient);
    setIsNewClientModalOpen(false);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Client List (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Clientes ({clients.length})</h3>
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        <div className="space-y-2">
          {clients.map((c) => {
            const isSelected = selectedClient?.id === c.id;
            const cSites = sites.filter((s) => s.clientId === c.id);

            return (
              <div
                key={c.id}
                id={`client-${c.id}`}
                onClick={() => handleSelectClient(c)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-950/40'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{c.company || 'Empresa'}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {cSites.length} {cSites.length === 1 ? 'sitio' : 'sitios'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{c.email}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Infrastructure Map & Details (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {selectedClient ? (
          <div className="space-y-6">
            {/* Header & Quick Financial Summary */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Ficha Técnica de Infraestructura
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                  {selectedClient.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedClient.company} • Contacto: {selectedClient.email} • {selectedClient.phone || '+595'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Infraestructura</span>
                </button>
              </div>
            </div>

            {/* Infrastructure Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Dominio */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Dominio Web</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedClient.infrastructure?.domain?.renewer === 'agency'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Renueva:{' '}
                    {selectedClient.infrastructure?.domain?.renewer === 'agency'
                      ? 'Impulsos Digitales'
                      : 'Cliente'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Proveedor:</span>
                    <span className="font-semibold text-white">
                      {selectedClient.infrastructure?.domain?.provider || 'nic.py'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Vencimiento:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {selectedClient.infrastructure?.domain?.expiryDate || '2026-11-20'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Costo Anual:</span>
                    <span className="font-bold text-white">
                      {selectedClient.infrastructure?.domain?.currency || 'PYG'}{' '}
                      {(selectedClient.infrastructure?.domain?.annualCost || 150000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Hosting */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span>Servidor / Hosting</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    Activo
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Proveedor:</span>
                    <span className="font-semibold text-white">
                      {selectedClient.infrastructure?.hosting?.provider || 'Hosting Paraguay (cPanel)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Plan:</span>
                    <span className="text-slate-200">
                      {selectedClient.infrastructure?.hosting?.plan || 'Shared Business 10GB'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Costo Anual:</span>
                    <span className="font-bold text-white">
                      {selectedClient.infrastructure?.hosting?.currency || 'PYG'}{' '}
                      {(selectedClient.infrastructure?.hosting?.annualCost || 450000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: DNS */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Gestión de DNS</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Zona Administrada en:</span>
                    <span className="font-semibold text-white">
                      {selectedClient.infrastructure?.dns?.provider || 'cPanel Host'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    {selectedClient.infrastructure?.dns?.notes || 'Zonas A, CNAME y MX administradas correctamente.'}
                  </div>
                </div>
              </div>

              {/* Card 4: Correo Corporativo */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Correo Corporativo</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Proveedor:</span>
                    <span className="font-semibold text-white">
                      {selectedClient.infrastructure?.email?.provider || 'Google Workspace'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Cuentas Activas:</span>
                    <span className="font-bold text-amber-400">
                      {selectedClient.infrastructure?.email?.accountsCount || 5} buzones
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Costo Anual:</span>
                    <span className="font-bold text-white">
                      {selectedClient.infrastructure?.email?.currency || 'USD'}{' '}
                      {(selectedClient.infrastructure?.email?.annualCost || 360).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Sites */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">
                  Sitios y Activos de {selectedClient.name} ({clientSites.length})
                </h3>
                <Link
                  href="/sites?action=new"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  + Asignar Nuevo Sitio
                </Link>
              </div>

              <div className="divide-y divide-slate-800/60">
                {clientSites.map((site) => (
                  <div key={site.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20">
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <Link href={`/sites/${site.id}`} className="hover:text-emerald-400 transition-colors">
                          {site.name}
                        </Link>
                        <a href={site.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{site.url}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-bold text-[10px]">
                        {site.type}
                      </span>
                      <Link
                        href={`/sites/${site.id}`}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                      >
                        Ver Cockpit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/20">
            Selecciona un cliente para visualizar su mapa de infraestructura técnica.
          </div>
        )}
      </div>

      {/* Edit Infrastructure Modal */}
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-400" />
                <span>Editar Infraestructura: {selectedClient.name}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInfrastructure} className="space-y-5 text-xs">
              {/* Dominio */}
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Dominio</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={domainProvider}
                      onChange={(e) => setDomainProvider(e.target.value)}
                      placeholder="nic.py, GoDaddy"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Responsable Renovación</label>
                    <select
                      value={domainRenewer}
                      onChange={(e: any) => setDomainRenewer(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    >
                      <option value="agency">Impulsos Digitales (Agencia)</option>
                      <option value="client">El Cliente Directamente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={domainExpiry}
                      onChange={(e) => setDomainExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Costo Anual</label>
                    <input
                      type="number"
                      value={domainCost}
                      onChange={(e) => setDomainCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Hosting */}
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider">Hosting / Servidor</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={hostingProvider}
                      onChange={(e) => setHostingProvider(e.target.value)}
                      placeholder="Hosting Paraguay cPanel, Vercel, Render"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Plan / Capacidad</label>
                    <input
                      type="text"
                      value={hostingPlan}
                      onChange={(e) => setHostingPlan(e.target.value)}
                      placeholder="Shared Business 10GB"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Costo Anual</label>
                    <input
                      type="number"
                      value={hostingCost}
                      onChange={(e) => setHostingCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Moneda</label>
                    <select
                      value={hostingCurrency}
                      onChange={(e) => setHostingCurrency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    >
                      <option value="PYG">PYG (Guaraníes)</option>
                      <option value="USD">USD (Dólares)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Correo y DNS */}
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">Correo y DNS</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Gestión DNS</label>
                    <input
                      type="text"
                      value={dnsProvider}
                      onChange={(e) => setDnsProvider(e.target.value)}
                      placeholder="cPanel Host, Cloudflare"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Proveedor de Correo</label>
                    <input
                      type="text"
                      value={emailProvider}
                      onChange={(e) => setEmailProvider(e.target.value)}
                      placeholder="Google Workspace, Microsoft 365, cPanel"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Cuentas de Correo</label>
                    <input
                      type="number"
                      value={emailAccounts}
                      onChange={(e) => setEmailAccounts(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Costo Anual Correo</label>
                    <input
                      type="number"
                      value={emailCost}
                      onChange={(e) => setEmailCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Guardar Ficha Técnica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Distribuidora del Este"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Razón Social / Empresa</label>
                <input
                  type="text"
                  placeholder="ej. Distribuidora del Este S.A."
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="contacto@distribuidora.com.py"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+595 981 123456"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
