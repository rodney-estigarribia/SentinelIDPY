'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Server,
  Globe,
  Filter,
  CreditCard,
  Layers,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  X,
  AlertTriangle,
  FileCode,
  Smartphone,
  Database,
  Mail,
  KeyRound,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import type { Site, Client } from '@/db/schema';

interface ServicesTableClientProps {
  initialSites: Site[];
  clients: Client[];
}

type CategoryTab = 'all' | 'web' | 'infra' | 'domains_dns' | 'email_license' | 'mobile';
type BillingFilter = 'all' | 'tc_agencia' | 'tc_cliente' | 'incluido';

// Normalized Providers Catalog
const NORMALIZED_PROVIDERS = [
  'nic.py (.py)',
  'Hosting Paraguay (cPanel)',
  'Render (Cloud Web/DB)',
  'Vercel (Frontend Cloud)',
  'Microsoft 365 (Correo & Apps)',
  'Google Workspace',
  'Cloudflare (DNS & Proxy)',
  'AWS (Amazon Web Services)',
  'Google Play & Apple App Store',
  'Namecheap',
  'GoDaddy',
  'Zoho',
  'Otro'
] as const;

export function ServicesTableClient({ initialSites, clients }: ServicesTableClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>('all');
  const [selectedBilling, setSelectedBilling] = useState<BillingFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Service Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('web_wordpress');
  const [formProviderSelect, setFormProviderSelect] = useState('nic.py (.py)');
  const [formCustomProvider, setFormCustomProvider] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formToken, setFormToken] = useState('');
  const [formClientId, setFormClientId] = useState<number>(clients[0]?.id || 1);

  // Group / System State
  const [formGroupSelect, setFormGroupSelect] = useState<string>('__new__');
  const [formCustomGroup, setFormCustomGroup] = useState('');

  // Relationship State
  const [formRelationTarget, setFormRelationTarget] = useState<string>('');
  const [formCustomRelationTarget, setFormCustomRelationTarget] = useState<string>('');
  const [formRelationType, setFormRelationType] = useState<'points_to' | 'depends_on' | 'hosts' | 'connects_to' | 'unlinked'>('depends_on');

  // Billing State
  const [formResp, setFormResp] = useState<'tc_cliente' | 'tc_agencia' | 'transferencia' | 'incluido'>('tc_cliente');
  const [formCost, setFormCost] = useState('');
  const [formCurrency, setFormCurrency] = useState<'PYG' | 'USD'>('PYG');
  const [formCycle, setFormCycle] = useState<'monthly' | 'annual' | 'free'>('annual');
  const [formRenewalDate, setFormRenewalDate] = useState('');
  const [formRoadmap, setFormRoadmap] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing services for the client selected in modal
  const clientExistingServices = sites.filter((s) => s.clientId === Number(formClientId));
  
  // Existing groups for the client selected in modal
  const clientExistingGroups = Array.from(
    new Set(clientExistingServices.map((s) => s.serviceGroup || 'General').filter(Boolean))
  );

  // All distinct groups across the current filtered client or all
  const availableGroups = Array.from(
    new Set(
      sites
        .filter((s) => selectedClient === 'all' || s.clientId === Number(selectedClient))
        .map((s) => s.serviceGroup || 'General')
        .filter(Boolean)
    )
  );

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
      (site.serviceGroup && site.serviceGroup.toLowerCase().includes(searchLower)) ||
      (site.roadmapNotes && site.roadmapNotes.toLowerCase().includes(searchLower));

    // Client
    const matchesClient =
      selectedClient === 'all' || site.clientId === parseInt(selectedClient, 10);

    // Group
    const matchesGroup =
      selectedGroup === 'all' || (site.serviceGroup || 'General') === selectedGroup;

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

    return matchesSearch && matchesClient && matchesGroup && matchesCat && matchesBill;
  });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isWp = formCategory === 'web_wordpress';
      const isVercel = formCategory === 'vercel';
      const siteType = isWp ? 'wordpress' : isVercel ? 'vercel' : 'sistema';

      const resolvedProvider =
        formProviderSelect === 'Otro' ? formCustomProvider || 'Personalizado' : formProviderSelect;

      const resolvedGroup =
        formGroupSelect === '__new__'
          ? formCustomGroup.trim() || 'General'
          : formGroupSelect || 'General';

      const resolvedTargetName =
        formRelationTarget === '__custom__'
          ? formCustomRelationTarget.trim()
          : formRelationTarget;

      const targetSiteObj = clientExistingServices.find((s) => s.name === resolvedTargetName);

      const relationshipsPayload = resolvedTargetName
        ? [
            {
              targetId: targetSiteObj?.id,
              targetName: resolvedTargetName,
              type: formRelationType,
            },
          ]
        : undefined;

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          type: siteType,
          category: formCategory,
          provider: resolvedProvider,
          serviceGroup: resolvedGroup,
          url: formUrl || `https://${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
          token: isWp ? formToken : undefined,
          clientId: Number(formClientId),
          billing: {
            responsibility: formResp,
            cycle: formCycle,
            cost: formCost ? parseFloat(formCost) : 0,
            currency: formCurrency,
            renewalDate: formRenewalDate || undefined,
          },
          relationships: relationshipsPayload,
          roadmapNotes: formRoadmap || undefined,
        }),
      });

      if (res.ok) {
        const createdService = await res.json();
        setSites((prev) => [createdService, ...prev]);
        setIsModalOpen(false);
        // Reset form
        setFormName('');
        setFormUrl('');
        setFormToken('');
        setFormCost('');
        setFormRoadmap('');
        setFormRelationTarget('');
        setFormCustomRelationTarget('');
        setFormCustomGroup('');
        setFormCustomProvider('');
      } else {
        const err = await res.json();
        alert(`Error al crear servicio: ${err.error || 'Desconocido'}`);
      }
    } catch (err: any) {
      alert(`Error en el envío: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat?: string | null, type?: string) => {
    switch (cat) {
      case 'dominio':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Globe className="w-3 h-3" /> Dominio
          </span>
        );
      case 'hosting':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Server className="w-3 h-3" /> Hosting / cPanel
          </span>
        );
      case 'servidor_bd':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="w-3 h-3" /> Servidor & BD (Cloud)
          </span>
        );
      case 'app_movil':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Smartphone className="w-3 h-3" /> App Móvil
          </span>
        );
      case 'correo':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Mail className="w-3 h-3" /> Correo
          </span>
        );
      case 'licencia':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <KeyRound className="w-3 h-3" /> Licencia Software
          </span>
        );
      case 'web_app':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileCode className="w-3 h-3" /> Web App Frontend
          </span>
        );
      case 'vercel':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-500/15 text-white border border-neutral-700">
            ▲ Vercel OnePage
          </span>
        );
      case 'web_wordpress':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-600/15 text-blue-300 border border-blue-500/30">
            W WordPress
          </span>
        );
    }
  };

  const getBillingBadge = (b?: Site['billing']) => {
    if (!b) {
      return <span className="text-slate-500 text-xs">Sin definir</span>;
    }

    if (b.responsibility === 'tc_agencia') {
      return (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
            TC Agencia (Rodney) ⚠️
          </span>
          {b.cost && (
            <div className="text-[11px] font-mono text-slate-300">
              {b.currency} {b.cost.toLocaleString()} / {b.cycle === 'monthly' ? 'mes' : 'año'}
            </div>
          )}
        </div>
      );
    }

    if (b.responsibility === 'tc_cliente') {
      return (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CreditCard className="w-3 h-3 text-emerald-400" />
            TC Cliente
          </span>
          {b.cost && (
            <div className="text-[11px] font-mono text-slate-400">
              {b.currency} {b.cost.toLocaleString()} / {b.cycle === 'monthly' ? 'mes' : 'año'}
            </div>
          )}
        </div>
      );
    }

    if (b.responsibility === 'incluido') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Incluido en Fee / Host
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
        {b.responsibility || 'Facturación directa'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Todos ({sites.length})
          </button>
          <button
            onClick={() => setSelectedCategory('web')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'web'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Webs & Apps ({webCount})
          </button>
          <button
            onClick={() => setSelectedCategory('infra')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'infra'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Hosting & Servidores ({infraCount})
          </button>
          <button
            onClick={() => setSelectedCategory('domains_dns')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'domains_dns'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Dominios & DNS ({domainDnsCount})
          </button>
          <button
            onClick={() => setSelectedCategory('email_license')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'email_license'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Correo & Licencias ({emailLicenseCount})
          </button>
          <button
            onClick={() => setSelectedCategory('mobile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'mobile'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Apps Móviles ({mobileCount})
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-sky-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Servicio o Activo</span>
        </button>
      </div>

      {/* Control bar: Search + Client Filter + Group Filter + Billing Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar servicio, proveedor, grupo, URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setSelectedGroup('all');
              }}
              className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group / System Filter */}
          {availableGroups.length > 0 && (
            <div className="flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
              >
                <option value="all">Todos los grupos / sistemas</option>
                {availableGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Billing Responsibility Select Filter */}
        <div className="flex items-center gap-2">
          <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <select
            value={selectedBilling}
            onChange={(e) => setSelectedBilling(e.target.value as BillingFilter)}
            className={`bg-slate-900/80 border rounded-lg px-2.5 py-2 text-xs focus:outline-none transition-colors ${
              selectedBilling === 'tc_agencia'
                ? 'border-red-500/50 text-red-300 font-bold bg-red-950/20'
                : selectedBilling === 'tc_cliente'
                ? 'border-emerald-500/50 text-emerald-300 font-medium bg-emerald-950/20'
                : 'border-slate-800 text-slate-300 focus:border-slate-700'
            }`}
          >
            <option value="all">Facturación: Todas</option>
            <option value="tc_agencia">
              TC Agencia (Rodney) ⚠️ {agencyTcCount > 0 ? `(${agencyTcCount})` : ''}
            </option>
            <option value="tc_cliente">TC del Cliente</option>
            <option value="incluido">Incluido en Hosting / Fee</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Servicio / Activo</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Sistema / Grupo</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Relaciones / Dependencias</th>
                <th className="py-3.5 px-4">Facturación</th>
                <th className="py-3.5 px-4">Roadmap / Deuda Técnica</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se encontraron servicios o activos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => {
                  const client = clients.find((c) => c.id === site.clientId);
                  return (
                    <tr
                      key={site.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Servicio y URL */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Link
                            href={`/services/${site.id}`}
                            className="hover:text-sky-400 transition-colors"
                          >
                            {site.name}
                          </Link>
                          {site.url && (
                            <a
                              href={site.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{site.provider || 'Proveedor general'}</span>
                          {site.url && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{site.url}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {client ? client.name : 'Sin asignar'}
                      </td>

                      {/* Sistema / Grupo */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <FolderTree className="w-3 h-3 text-indigo-400" />
                          {site.serviceGroup || 'General'}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="py-3.5 px-4">
                        {getCategoryBadge(site.category, site.type)}
                      </td>

                      {/* Relaciones / Dependencias */}
                      <td className="py-3.5 px-4">
                        {site.relationships && site.relationships.length > 0 ? (
                          <div className="space-y-1">
                            {site.relationships.map((rel, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-[11px] text-slate-300"
                              >
                                <span className="text-cyan-400 font-bold uppercase text-[9px] px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50">
                                  {rel.type === 'points_to'
                                    ? 'Apunta a'
                                    : rel.type === 'depends_on'
                                    ? 'Depende de'
                                    : rel.type === 'hosts'
                                    ? 'Aloja'
                                    : rel.type === 'connects_to'
                                    ? 'Conecta con'
                                    : 'Vinculado a'}
                                </span>
                                <span className="truncate max-w-[170px]" title={rel.targetName}>
                                  {rel.targetName}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Independiente</span>
                        )}
                      </td>

                      {/* Facturación */}
                      <td className="py-3.5 px-4">
                        {getBillingBadge(site.billing)}
                      </td>

                      {/* Roadmap / Deuda Técnica */}
                      <td className="py-3.5 px-4">
                        {site.roadmapNotes ? (
                          <div
                            className="max-w-[220px] text-[11px] text-amber-300/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 leading-tight"
                            title={site.roadmapNotes}
                          >
                            {site.roadmapNotes}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Al día</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/services/${site.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 inline-block"
                        >
                          Cockpit
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
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
              {/* Cliente y Nombre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cliente Asignado</label>
                  <select
                    value={formClientId}
                    onChange={(e) => {
                      setFormClientId(Number(e.target.value));
                      setFormRelationTarget('');
                      setFormGroupSelect('__new__');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoría del Servicio</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="web_wordpress">Web WordPress (Conector)</option>
                    <option value="web_app">Web App / Frontend SPA</option>
                    <option value="vercel">Vercel OnePage</option>
                    <option value="dominio">Dominio (.com.py, .com)</option>
                    <option value="hosting">Hosting / cPanel</option>
                    <option value="dns">Zona DNS</option>
                    <option value="correo">Correo (M365, Workspace)</option>
                    <option value="servidor_bd">Servidor & Base de Datos (Render, etc.)</option>
                    <option value="app_movil">App Móvil (Android & iOS)</option>
                    <option value="licencia">Licencia de Software</option>
                    <option value="otro">Otro Servicio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Servicio / Activo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Plataforma Backend API, Dominio nic.py, Correo M365"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Proveedor Normalizado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Proveedor Tecnológico</label>
                  <select
                    value={formProviderSelect}
                    onChange={(e) => setFormProviderSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    {NORMALIZED_PROVIDERS.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  {formProviderSelect === 'Otro' && (
                    <input
                      type="text"
                      placeholder="Escribir nombre del proveedor..."
                      value={formCustomProvider}
                      onChange={(e) => setFormCustomProvider(e.target.value)}
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL / Acceso / Endpoint</label>
                  <input
                    type="text"
                    placeholder="https://ejemplo.com"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Sistema / Grupo */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
                  Agrupación de Sistema / Proyecto
                </span>
                <p className="text-slate-400 text-[11px]">
                  Permite organizar los activos del cliente en módulos lógicos (ej. Plataforma Dagda, Página Web, Sistemas Empresariales).
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1">Grupo del Cliente</label>
                    <select
                      value={formGroupSelect}
                      onChange={(e) => setFormGroupSelect(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      {clientExistingGroups.map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                      <option value="__new__">+ Crear nuevo grupo / sistema</option>
                    </select>
                  </div>

                  {formGroupSelect === '__new__' && (
                    <div>
                      <label className="block text-slate-400 mb-1">Nombre del Nuevo Grupo</label>
                      <input
                        type="text"
                        placeholder="ej. Plataforma Dagda, Página Web..."
                        value={formCustomGroup}
                        onChange={(e) => setFormCustomGroup(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Relaciones Dinámicas con Servicios del Cliente */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Relación e Interdependencia con otro Servicio
                </span>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1">Tipo de Relación</label>
                    <select
                      value={formRelationType}
                      onChange={(e: any) => setFormRelationType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="depends_on">Depende de (ej. App depende de Backend)</option>
                      <option value="points_to">Apunta a (ej. Dominio apunta a Hosting / DNS)</option>
                      <option value="hosts">Aloja a (ej. Hosting aloja Web App)</option>
                      <option value="connects_to">Conecta con (ej. Frontend conecta con API)</option>
                      <option value="unlinked">Sin vincular (Independiente)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Servicio Destino</label>
                    <select
                      value={formRelationTarget}
                      onChange={(e) => setFormRelationTarget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- Sin dependencia / Independiente --</option>
                      {clientExistingServices.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.category?.replace('_', ' ')})
                        </option>
                      ))}
                      <option value="__custom__">Otro activo o servicio externo...</option>
                    </select>
                  </div>
                </div>

                {formRelationTarget === '__custom__' && (
                  <div className="pt-2">
                    <label className="block text-slate-400 mb-1">Nombre del Servicio Externo</label>
                    <input
                      type="text"
                      placeholder="ej. Servidor Legacy o API externa..."
                      value={formCustomRelationTarget}
                      onChange={(e) => setFormCustomRelationTarget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
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
                      placeholder="ej. 150000 o 25"
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

              {/* Roadmap */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hoja de Ruta (Roadmap) o Deuda Técnica</label>
                <textarea
                  rows={2}
                  placeholder="ej. 🚀 Migrar de Angular a React en Vercel, o ⚠️ Traspasar pago a TC cliente"
                  value={formRoadmap}
                  onChange={(e) => setFormRoadmap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Token de Seguridad exclusivo para WordPress */}
              {formCategory === 'web_wordpress' && (
                <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                  <label className="block text-blue-300 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      Token de Conector WordPress (SentinelIDPY v4.2)
                    </span>
                    <span className="text-[10px] text-blue-400/80 uppercase">Solo WordPress</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Pega el token secreto generado en Ajustes → SentinelIDPY de WordPress para habilitar el reporte automático de Wordfence y plugins.
                  </p>
                  <input
                    type="text"
                    placeholder="Pegar token X-WF-Report-Token aquí..."
                    value={formToken}
                    onChange={(e) => setFormToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
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
