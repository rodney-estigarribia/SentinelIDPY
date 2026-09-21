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
  CheckCircle2,
  AlertTriangle,
  Server,
  X,
  Lock,
  CreditCard,
  ArrowRight,
  Database,
  Smartphone,
  Mail,
  FileCode,
  KeyRound,
  Sparkles,
  AlertOctagon
} from 'lucide-react';
import type { Site, Client } from '@/db/schema';

interface SitesTableClientProps {
  initialSites: Site[];
  clients: Client[];
}

type CategoryTab = 'all' | 'web' | 'infra' | 'domains_dns' | 'email_license' | 'mobile';
type BillingFilter = 'all' | 'tc_agencia' | 'tc_cliente' | 'incluido';

export function SitesTableClient({ initialSites, clients }: SitesTableClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [selectedBilling, setSelectedBilling] = useState<BillingFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Service Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('web_wordpress');
  const [formProvider, setFormProvider] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formToken, setFormToken] = useState('');
  const [formClientId, setFormClientId] = useState<number>(clients[0]?.id || 1);
  const [formResp, setFormResp] = useState<'tc_cliente' | 'tc_agencia' | 'transferencia' | 'incluido'>('tc_cliente');
  const [formCost, setFormCost] = useState('');
  const [formCurrency, setFormCurrency] = useState<'PYG' | 'USD'>('PYG');
  const [formCycle, setFormCycle] = useState<'monthly' | 'annual' | 'free'>('annual');
  const [formRenewalDate, setFormRenewalDate] = useState('');
  const [formRelationships, setFormRelationships] = useState('');
  const [formRoadmap, setFormRoadmap] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category matchers
  const isWeb = (s: Site) =>
    s.category === 'web_wordpress' ||
    s.category === 'web_app' ||
    s.category === 'vercel' ||
    s.type === 'wordpress' ||
    s.type === 'vercel';

  const isInfra = (s: Site) => s.category === 'hosting' || s.category === 'servidor_bd';
  const isDomainDns = (s: Site) => s.category === 'dominio' || s.category === 'dns';
  const isEmailLicense = (s: Site) => s.category === 'correo' || s.category === 'licencia';
  const isMobile = (s: Site) => s.category === 'app_movil';

  // Counts
  const webCount = sites.filter(isWeb).length;
  const infraCount = sites.filter(isInfra).length;
  const domainDnsCount = sites.filter(isDomainDns).length;
  const emailLicenseCount = sites.filter(isEmailLicense).length;
  const mobileCount = sites.filter(isMobile).length;

  const agencyTcCount = sites.filter((s) => s.billing?.responsibility === 'tc_agencia').length;

  const filteredSites = sites.filter((site) => {
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch =
      site.name.toLowerCase().includes(searchLower) ||
      site.url.toLowerCase().includes(searchLower) ||
      (site.provider && site.provider.toLowerCase().includes(searchLower)) ||
      (site.roadmapNotes && site.roadmapNotes.toLowerCase().includes(searchLower)) ||
      (site.billing?.notes && site.billing.notes.toLowerCase().includes(searchLower));

    // Client
    const matchesClient =
      selectedClient === 'all' || site.clientId === parseInt(selectedClient, 10);

    // Category
    let matchesCat = true;
    if (selectedCategory === 'web') matchesCat = isWeb(site);
    else if (selectedCategory === 'infra') matchesCat = isInfra(site);
    else if (selectedCategory === 'domains_dns') matchesCat = isDomainDns(site);
    else if (selectedCategory === 'email_license') matchesCat = isEmailLicense(site);
    else if (selectedCategory === 'mobile') matchesCat = isMobile(site);

    // Billing
    let matchesBill = true;
    if (selectedBilling !== 'all') {
      matchesBill = site.billing?.responsibility === selectedBilling;
    }

    return matchesSearch && matchesClient && matchesCat && matchesBill;
  });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isWp = formCategory === 'web_wordpress';
      const isVercel = formCategory === 'vercel';
      const siteType = isWp ? 'wordpress' : isVercel ? 'vercel' : 'sistema';

      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          type: siteType,
          category: formCategory,
          provider: formProvider || (isWp ? 'WordPress' : isVercel ? 'Vercel' : 'Hosting'),
          url: formUrl,
          token: formToken,
          clientId: Number(formClientId),
          billing: {
            responsibility: formResp,
            cycle: formCycle,
            cost: formCost ? parseFloat(formCost) : 0,
            currency: formCurrency,
            renewalDate: formRenewalDate || undefined,
          },
          relationships: formRelationships
            ? [{ targetName: formRelationships, type: 'depends_on' }]
            : undefined,
          roadmapNotes: formRoadmap || undefined,
        }),
      });

      if (res.ok) {
        const createdService = await res.json();
        setSites([createdService, ...sites]);
        setIsModalOpen(false);
        // Reset form
        setFormName('');
        setFormProvider('');
        setFormUrl('');
        setFormToken('');
        setFormCost('');
        setFormRelationships('');
        setFormRoadmap('');
      } else {
        alert('Error al crear el servicio');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryBadge = (site: Site) => {
    switch (site.category) {
      case 'dominio':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe className="w-3 h-3" /> Dominio
          </span>
        );
      case 'hosting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Server className="w-3 h-3" /> Hosting / cPanel
          </span>
        );
      case 'correo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Mail className="w-3 h-3" /> Correo
          </span>
        );
      case 'licencia':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <KeyRound className="w-3 h-3" /> Licencia
          </span>
        );
      case 'servidor_bd':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Database className="w-3 h-3" /> Servidor & BD
          </span>
        );
      case 'app_movil':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Smartphone className="w-3 h-3" /> App Móvil
          </span>
        );
      case 'web_app':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileCode className="w-3 h-3" /> Web App
          </span>
        );
      case 'vercel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            ▲ Vercel OnePage
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Globe className="w-3 h-3" /> WordPress
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos los Servicios ({sites.length})
          </button>
          <button
            onClick={() => setSelectedCategory('web')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'web'
                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Webs & Apps ({webCount})
          </button>
          <button
            onClick={() => setSelectedCategory('infra')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'infra'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hosting & Servidores ({infraCount})
          </button>
          <button
            onClick={() => setSelectedCategory('domains_dns')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'domains_dns'
                ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dominios & DNS ({domainDnsCount})
          </button>
          <button
            onClick={() => setSelectedCategory('email_license')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'email_license'
                ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Correo & Licencias ({emailLicenseCount})
          </button>
          <button
            onClick={() => setSelectedCategory('mobile')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'mobile'
                ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apps Móviles ({mobileCount})
          </button>
        </div>

        {/* Quick Billing Filter: Highlight TC Rodney */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            Pago:
          </span>
          <button
            onClick={() => setSelectedBilling('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedBilling === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedBilling('tc_agencia')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              selectedBilling === 'tc_agencia'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <span>TC Agencia (Rodney)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px]">
              {agencyTcCount}
            </span>
          </button>
          <button
            onClick={() => setSelectedBilling('tc_cliente')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              selectedBilling === 'tc_cliente'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TC Cliente
          </button>
        </div>
      </div>

      {/* Search, Client Filter, and Add Service Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por servicio, proveedor, roadmap, URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-md shadow-sky-950/50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Servicio o Activo</span>
        </button>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Servicio / Activo</th>
                <th className="py-3 px-4">Cliente Asignado</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Relaciones / Dependencias</th>
                <th className="py-3 px-4">Facturación / Quién Paga</th>
                <th className="py-3 px-4">Roadmap / Deuda Técnica</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron servicios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => {
                  const client = clients.find((c) => c.id === site.clientId);
                  const isAgencyTc = site.billing?.responsibility === 'tc_agencia';
                  const isClientTc = site.billing?.responsibility === 'tc_cliente';

                  return (
                    <tr key={site.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Servicio / Activo */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Link
                            href={`/sites/${site.id}`}
                            className="hover:text-sky-400 transition-colors text-sm"
                          >
                            {site.name}
                          </Link>
                          {site.url && site.url !== 'https://nic.py' && (
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-200"
                              title="Abrir enlace"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {site.provider && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {site.provider}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono truncate">
                            {site.url}
                          </span>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">
                          {client ? client.name : 'Sin asignar'}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="py-3.5 px-4">
                        {renderCategoryBadge(site)}
                      </td>

                      {/* Relaciones & Dependencias */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {site.relationships && site.relationships.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {site.relationships.map((rel, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300"
                              >
                                {rel.type === 'unlinked' ? (
                                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                                    ⚠️ Sin conexión
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-sky-400">↳</span>
                                    <span className="truncate">{rel.targetName}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Facturación / Quién Paga */}
                      <td className="py-3.5 px-4">
                        {isAgencyTc ? (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <CreditCard className="w-3 h-3" />
                              TC Rodney (Agencia) ⚠️
                            </span>
                            {site.billing?.cost ? (
                              <span className="text-[11px] text-slate-300 font-mono">
                                {site.billing.currency === 'USD' ? '$' : 'Gs. '}
                                {site.billing.cost.toLocaleString()} / {site.billing.cycle === 'monthly' ? 'mes' : 'año'}
                              </span>
                            ) : null}
                          </div>
                        ) : isClientTc ? (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <CreditCard className="w-3 h-3" />
                              TC Cliente
                            </span>
                            {site.billing?.cost ? (
                              <span className="text-[11px] text-slate-300 font-mono">
                                {site.billing.currency === 'USD' ? '$' : 'Gs. '}
                                {site.billing.cost.toLocaleString()} / {site.billing.cycle === 'monthly' ? 'mes' : 'año'}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {site.billing?.responsibility === 'incluido'
                              ? 'Incluido en Plan'
                              : 'No especificado'}
                          </span>
                        )}
                      </td>

                      {/* Roadmap / Deuda Técnica */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {site.roadmapNotes ? (
                          <div
                            className={`p-1.5 rounded-lg text-[11px] leading-relaxed border ${
                              site.roadmapNotes.includes('⚠️')
                                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                                : site.roadmapNotes.includes('🚀')
                                ? 'bg-sky-950/30 border-sky-500/30 text-sky-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            {site.roadmapNotes}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/sites/${site.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 inline-block"
                        >
                          Administrar
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

      {/* Modal: Añadir Nuevo Servicio o Activo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Añadir Nuevo Servicio o Activo</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Servicio / Activo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. App Móvil Pedidos, Backend API Render, Dominio nic.py"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría del Servicio</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="web_wordpress">Web WordPress</option>
                    <option value="web_app">Web App / Panel Frontend</option>
                    <option value="vercel">Vercel OnePage</option>
                    <option value="dominio">Dominio (nic.py, etc.)</option>
                    <option value="hosting">Hosting / cPanel</option>
                    <option value="dns">Zona DNS</option>
                    <option value="correo">Correo (M365, Workspace)</option>
                    <option value="servidor_bd">Servidor & Base de Datos (Render, etc.)</option>
                    <option value="app_movil">App Móvil (Android & iOS)</option>
                    <option value="licencia">Licencia de Software</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cliente Asignado</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Proveedor / Plataforma</label>
                  <input
                    type="text"
                    placeholder="ej. nic.py, Render, Hosting Paraguay, M365"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL / Endpoint / Acceso</label>
                  <input
                    type="text"
                    placeholder="https://app.dagda.com.py"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Facturación */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  Facturación & Responsabilidad de Pago
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">¿Quién Paga?</label>
                    <select
                      value={formResp}
                      onChange={(e: any) => setFormResp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="tc_cliente">TC del Cliente</option>
                      <option value="tc_agencia">TC de la Agencia (Rodney) ⚠️</option>
                      <option value="incluido">Incluido en Hosting / Fee</option>
                      <option value="transferencia">Transferencia Bancaria</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Frecuencia</label>
                    <select
                      value={formCycle}
                      onChange={(e: any) => setFormCycle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="annual">Anual</option>
                      <option value="monthly">Mensual</option>
                      <option value="free">Gratuito / Incluido</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Monto / Costo</label>
                    <input
                      type="number"
                      placeholder="ej. 150000 o 15"
                      value={formCost}
                      onChange={(e) => setFormCost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Moneda</label>
                    <select
                      value={formCurrency}
                      onChange={(e: any) => setFormCurrency(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="PYG">Guaraníes (PYG)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Relaciones & Roadmap */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dependencia / Relación con otro servicio</label>
                <input
                  type="text"
                  placeholder="ej. Backend API & Base de Datos (Render Postgres)"
                  value={formRelationships}
                  onChange={(e) => setFormRelationships(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hoja de Ruta (Roadmap) o Nota Técnica</label>
                <textarea
                  rows={2}
                  placeholder="ej. 🚀 Migrar a React y desplegar en Vercel, o ⚠️ Cuenta mal licenciada"
                  value={formRoadmap}
                  onChange={(e) => setFormRoadmap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {formCategory === 'web_wordpress' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Token de Seguridad SentinelIDPY (Connector)</span>
                    <span className="text-[10px] text-slate-400">Opcional</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pegar token de Configuración → SentinelIDPY del cliente"
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-950"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
