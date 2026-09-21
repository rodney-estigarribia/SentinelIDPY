'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  AlertTriangle,
  Layers,
  FolderTree,
  X,
  Folder,
  MessageSquare,
  Sparkles,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Search,
  Building2,
  Briefcase,
  History,
  Tag
} from 'lucide-react';
import type { Client, Site, Project, ClientTimelineEvent } from '@/db/schema';
import { GroupManagerModal } from '@/components/services/group-manager-modal';
import { TeamSnippetsModal } from '@/components/team/team-snippets-modal';
import { Badge, Note } from '@/components/ui';

interface ClientsClientProps {
  initialClients: Client[];
  sites: Site[];
  initialProjects?: Project[];
}

export function ClientsClient({ initialClients, sites, initialProjects = [] }: ClientsClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [currentSites, setCurrentSites] = useState<Site[]>(sites);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'infrastructure' | 'timeline' | 'projects'>('infrastructure');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isTeamSnippetsOpen, setIsTeamSnippetsOpen] = useState(false);

  useEffect(() => {
    setCurrentSites(sites);
  }, [sites]);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Client Details Edit State
  const [editName, setEditName] = useState('');
  const [editLegalName, setEditLegalName] = useState('');
  const [editRuc, setEditRuc] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editAcquisitionChannel, setEditAcquisitionChannel] = useState('');
  const [editDriveFolderUrl, setEditDriveFolderUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Timeline Event Form State
  const [eventYear, setEventYear] = useState('2026');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState<'milestone' | 'migration' | 'churn' | 'upgrade' | 'note'>('milestone');
  const [eventActor, setEventActor] = useState<'ana' | 'martin' | 'diana' | 'carla' | 'rodney'>('rodney');

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
  const [newClientLegalName, setNewClientLegalName] = useState('');
  const [newClientRuc, setNewClientRuc] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<'active' | 'migrated' | 'churned' | 'lead'>('active');
  const [newClientChannel, setNewClientChannel] = useState('direct');
  const [newClientDrive, setNewClientDrive] = useState('');

  const clientSites = selectedClient
    ? currentSites.filter((s) => s.clientId === selectedClient.id)
    : [];

  const clientProjects = selectedClient
    ? projects.filter((p) => p.clientId === selectedClient.id)
    : [];

  const agencyPaidServices = clientSites.filter((s) => s.billing?.responsibility === 'tc_agencia');

  const groupedServices = clientSites.reduce((acc, site) => {
    const grp = site.serviceGroup || 'General';
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(site);
    return acc;
  }, {} as Record<string, Site[]>);

  const groupNames = Object.keys(groupedServices);

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

  const openClientDetailsModal = () => {
    if (!selectedClient) return;
    setEditName(selectedClient.name);
    setEditLegalName(selectedClient.legalName || '');
    setEditRuc(selectedClient.ruc || '');
    setEditCompany(selectedClient.company || '');
    setEditEmail(selectedClient.email || '');
    setEditPhone(selectedClient.phone || '');
    setEditStatus(selectedClient.status || 'active');
    setEditAcquisitionChannel(selectedClient.acquisitionChannel || 'direct');
    setEditDriveFolderUrl(selectedClient.driveFolderUrl || '');
    setEditNotes(selectedClient.notes || '');
    setIsClientDetailsModalOpen(true);
  };

  const handleSaveClientDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const updatedData = {
      name: editName,
      legalName: editLegalName || null,
      ruc: editRuc || null,
      company: editCompany || null,
      email: editEmail || null,
      phone: editPhone || null,
      status: editStatus,
      acquisitionChannel: editAcquisitionChannel || null,
      driveFolderUrl: editDriveFolderUrl || null,
      notes: editNotes || null,
    };

    const updatedClient: Client = {
      ...selectedClient,
      ...updatedData,
      updatedAt: new Date(),
    };

    setClients((prev) =>
      prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
    );
    setSelectedClient(updatedClient);
    setIsClientDetailsModalOpen(false);

    try {
      await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
    } catch (err) {
      console.error('Failed to patch client in DB:', err);
    }
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

    try {
      await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infrastructure: updatedInfrastructure }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !eventTitle) return;

    const newEvent: ClientTimelineEvent = {
      id: `t-${selectedClient.id}-${Date.now()}`,
      year: eventYear,
      date: eventDate,
      title: eventTitle,
      description: eventDescription,
      category: eventCategory,
      actor: eventActor,
    };

    const currentTimeline = Array.isArray(selectedClient.timeline) ? selectedClient.timeline : [];
    const updatedTimeline = [...currentTimeline, newEvent];

    const updatedClient: Client = {
      ...selectedClient,
      timeline: updatedTimeline,
    };

    setClients((prev) =>
      prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
    );
    setSelectedClient(updatedClient);
    setIsTimelineModalOpen(false);

    // Reset event form
    setEventTitle('');
    setEventDescription('');

    try {
      await fetch(`/api/clients/${selectedClient.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
    } catch (err) {
      console.error('Failed to persist timeline event:', err);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newClientData = {
      name: newClientName,
      legalName: newClientLegalName || null,
      ruc: newClientRuc || null,
      company: newClientCompany || null,
      email: newClientEmail || null,
      phone: newClientPhone || null,
      status: newClientStatus,
      acquisitionChannel: newClientChannel || null,
      driveFolderUrl: newClientDrive || null,
      notes: '',
      timeline: [
        {
          id: `t-init-${Date.now()}`,
          year: new Date().getFullYear().toString(),
          date: new Date().toISOString().split('T')[0],
          title: 'Cliente Registrado en SentinelIDPY',
          description: 'Apertura de ficha técnica y CRM comercial.',
          category: 'milestone' as const,
          actor: 'rodney' as const,
        }
      ],
      infrastructure: {
        domain: { provider: 'nic.py', renewer: 'agency' as const, annualCost: 150000, currency: 'PYG' },
        hosting: { provider: 'Hosting Paraguay', plan: 'Shared 5GB', annualCost: 450000, currency: 'PYG' },
        dns: { provider: 'cPanel Host' },
        email: { provider: 'Google Workspace', accountsCount: 3, annualCost: 216, currency: 'USD' }
      }
    };

    const fakeId = Math.max(0, ...clients.map((c) => c.id)) + 1;
    const optimisticClient: Client = {
      id: fakeId,
      ...newClientData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setClients([...clients, optimisticClient]);
    setSelectedClient(optimisticClient);
    setIsNewClientModalOpen(false);

    // Clear inputs
    setNewClientName('');
    setNewClientLegalName('');
    setNewClientRuc('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientDrive('');

    try {
      const res = await fetch('/api/services', { // or clients route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData),
      });
      if (res.ok) {
        const created = await res.json();
        setClients((prev) => prev.map((c) => (c.id === fakeId ? created : c)));
        setSelectedClient(created);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'migrated':
        return {
          label: 'Migró a Wix',
          classes: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
        };
      case 'churned':
        return {
          label: 'Baja',
          classes: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
        };
      case 'lead':
        return {
          label: 'Lead / En Cierre',
          classes: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
        };
      default:
        return {
          label: 'Activo',
          classes: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
        };
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'milestone':
        return { label: 'Hito Clave', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' };
      case 'migration':
        return { label: 'Migración Externa', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' };
      case 'churn':
        return { label: 'Baja / Desactivación', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' };
      case 'upgrade':
        return { label: 'Renovación / Upgrade', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' };
      default:
        return { label: 'Nota Operativa', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const getActorBadge = (actor?: string) => {
    switch (actor) {
      case 'ana':
        return 'Ana (Comercial)';
      case 'martin':
        return 'Martín (Técnico)';
      case 'diana':
        return 'Diana (Admin)';
      case 'carla':
        return 'Carla (Social)';
      default:
        return 'Rodney';
    }
  };

  // Filter clients by search query
  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.legalName && c.legalName.toLowerCase().includes(q)) ||
      (c.ruc && c.ruc.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Client List (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Clientes CRM</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {clients.length}
            </span>
          </div>
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Search filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
          />
        </div>

        {/* Client Items */}
        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredClients.map((c) => {
            const isSelected = selectedClient?.id === c.id;
            const cSites = sites.filter((s) => s.clientId === c.id);
            const cProjects = projects.filter((p) => p.clientId === c.id);
            const statusInfo = getStatusBadge(c.status);

            return (
              <div
                key={c.id}
                id={`client-${c.id}`}
                onClick={() => handleSelectClient(c)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {c.name}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusInfo.classes}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {c.legalName || c.company || 'Empresa'}
                    </p>

                    {c.ruc && (
                      <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        RUC: {c.ruc}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {cSites.length} serv • {cProjects.length} proy
                    </span>

                    {cSites.some((s) => s.billing?.responsibility === 'tc_agencia') && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                        TC Rodney ⚠️
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span className="truncate">{c.email || 'Sin correo'}</span>
                  {c.acquisitionChannel && (
                    <span className="text-[10px] text-slate-400 capitalize">
                      {c.acquisitionChannel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Client 360° CRM & Tabs (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {selectedClient ? (
          <div className="space-y-6">
            {/* Header: Legal & Operational Profile */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Ficha CRM 360°
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(selectedClient.status).classes}`}>
                      {getStatusBadge(selectedClient.status).label}
                    </span>
                    {selectedClient.acquisitionChannel && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 capitalize">
                        Canal: {selectedClient.acquisitionChannel}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                    {selectedClient.name}
                  </h2>

                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                    {selectedClient.legalName && (
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">Razón Social:</strong>{' '}
                        {selectedClient.legalName}
                      </p>
                    )}
                    {selectedClient.ruc && (
                      <p className="font-mono">
                        <strong className="text-slate-800 dark:text-slate-200 font-sans">RUC:</strong>{' '}
                        {selectedClient.ruc}
                      </p>
                    )}
                    <p>
                      Contacto: {selectedClient.email || 'N/A'} • Teléfono: {selectedClient.phone || '+595'}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 sm:self-start">
                  {selectedClient.driveFolderUrl && (
                    <a
                      href={selectedClient.driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                      title="Abrir carpeta Google Drive: [Cliente] / [Año] / [Proyecto]"
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>Google Drive</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}

                  <button
                    onClick={() => setIsTeamSnippetsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    title="Copiar mensajes firmados por Ana, Martín, Diana o Carla"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Copys Rápidos</span>
                  </button>

                  <button
                    onClick={openClientDetailsModal}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar CRM</span>
                  </button>
                </div>
              </div>

              {/* Notes alert if any */}
              {selectedClient.notes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 italic">
                  "{selectedClient.notes}"
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('infrastructure')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'infrastructure'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Infraestructura & Servicios ({clientSites.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Línea de Tiempo ({selectedClient.timeline?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Proyectos Pipeline ({clientProjects.length})</span>
              </button>
            </div>

            {/* TAB 1: INFRASTRUCTURE & SERVICES */}
            {activeTab === 'infrastructure' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Warning banner for services charged to Agency TC */}
                {agencyPaidServices.length > 0 && (
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/90 dark:bg-red-950/20 flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-2 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-800 dark:text-red-300">
                          ⚠️ Atención de Facturación: {agencyPaidServices.length} servicio(s) pagado(s) con la TC de la Agencia (Rodney)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-500/30 uppercase tracking-wider">
                          Requiere Regularización
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        Estos activos se encuentran actualmente a cargo financiero de Rodney / Impulsos Digitales. Coordinar el traspaso del método de pago directo a la tarjeta del cliente:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {agencyPaidServices.map((s) => (
                          <div
                            key={s.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 text-slate-900 dark:text-white text-[11px] shadow-sm"
                          >
                            <span className="font-bold text-red-700 dark:text-red-300">{s.name}</span>
                            <span className="text-slate-500 dark:text-slate-400">({s.provider || 'Proveedor'})</span>
                            {s.billing?.cost && (
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                {s.billing.currency} {s.billing.cost.toLocaleString()} / {s.billing.cycle === 'monthly' ? 'mes' : 'año'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Infrastructure Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dominio */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold text-sm">
                        <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Dominio Web</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          selectedClient.infrastructure?.domain?.renewer === 'agency'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        Renueva:{' '}
                        {selectedClient.infrastructure?.domain?.renewer === 'agency'
                          ? 'Impulsos Digitales'
                          : 'Cliente'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Proveedor:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.domain?.provider || 'nic.py'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Vencimiento:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {selectedClient.infrastructure?.domain?.expiryDate || '2026-11-20'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Costo Anual:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.domain?.currency || 'PYG'}{' '}
                          {(selectedClient.infrastructure?.domain?.annualCost || 150000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hosting */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold text-sm">
                        <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Servidor / Hosting</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                        Activo
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Proveedor:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.hosting?.provider || 'Hosting Paraguay (cPanel)'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Plan:</span>
                        <span className="text-slate-700 dark:text-slate-200">
                          {selectedClient.infrastructure?.hosting?.plan || 'Shared Business 10GB'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Costo Anual:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.hosting?.currency || 'PYG'}{' '}
                          {(selectedClient.infrastructure?.hosting?.annualCost || 450000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DNS */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold text-sm">
                        <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Gestión de DNS</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Zona Administrada en:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.dns?.provider || 'cPanel Host'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        {selectedClient.infrastructure?.dns?.notes || 'Zonas A, CNAME y MX administradas correctamente.'}
                      </div>
                    </div>
                  </div>

                  {/* Correo Corporativo */}
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold text-sm">
                        <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Correo Corporativo</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Proveedor:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.email?.provider || 'Google Workspace'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Cuentas Activas:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {selectedClient.infrastructure?.email?.accountsCount || 5} buzones
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Costo Anual:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedClient.infrastructure?.email?.currency || 'USD'}{' '}
                          {(selectedClient.infrastructure?.email?.annualCost || 360).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Ficha Técnica de Infraestructura</span>
                  </button>
                </div>

                {/* Grouped Services & Assets */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Servicios y Activos de {selectedClient.name} ({clientSites.length})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Infraestructura organizada por Sistemas y Ecosistemas lógicos, dependencias y facturación.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsGroupModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>⚙️ Administrar Grupos</span>
                      </button>
                      <Link
                        href="/services"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
                      >
                        Ver en Servicios →
                      </Link>
                    </div>
                  </div>

                  {clientSites.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Este cliente aún no tiene servicios o activos registrados.
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {groupNames.map((grpName) => {
                        const groupSites = groupedServices[grpName];
                        const hasAgencyCardInGroup = groupSites.some(
                          (s) => s.billing?.responsibility === 'tc_agencia'
                        );

                        return (
                          <div
                            key={grpName}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 overflow-hidden shadow-sm"
                          >
                            <div className="p-3 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                                  {grpName}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {groupSites.length} {groupSites.length === 1 ? 'activo' : 'activos'}
                                </span>
                              </div>

                              {hasAgencyCardInGroup && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                  Activo en TC Rodney
                                </span>
                              )}
                            </div>

                            <div className="divide-y divide-slate-200/70 dark:divide-slate-800/60">
                              {groupSites.map((site) => (
                                <div
                                  key={site.id}
                                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                  <div className="space-y-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 flex-wrap">
                                      <Link
                                        href={`/services/${site.id}`}
                                        className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                      >
                                        {site.name}
                                      </Link>
                                      {site.url && (
                                        <a
                                          href={site.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                      {site.category && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                          {site.category.replace('_', ' ')}
                                        </span>
                                      )}
                                      {site.provider && (
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                          ({site.provider})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                                      {site.url}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                                    {site.billing && (
                                      <div className="text-right text-xs">
                                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                                          {site.billing.cost ? `${site.billing.currency} ${site.billing.cost.toLocaleString()}` : 'Sin costo'}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                          {site.billing.responsibility === 'tc_agencia' ? 'TC Rodney ⚠️' : 'Facturado directo'}
                                        </span>
                                      </div>
                                    )}

                                    <Link
                                      href={`/services/${site.id}`}
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TIMELINE / HISTORIAL */}
            {activeTab === 'timeline' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Línea de Tiempo Cronológica
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hitos, migraciones, bajas históricas y notas de evolución del cliente.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsTimelineModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Hito</span>
                  </button>
                </div>

                {!selectedClient.timeline || selectedClient.timeline.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No hay eventos registrados en la línea de tiempo de este cliente. ¡Añade el primer hito!
                  </div>
                ) : (
                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {selectedClient.timeline.map((event) => {
                      const catBadge = getCategoryBadge(event.category);
                      return (
                        <div key={event.id} className="relative group">
                          {/* Dot marker */}
                          <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>

                          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                                  {event.year}
                                </span>
                                {event.date && (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {event.date}
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catBadge.color}`}>
                                  {catBadge.label}
                                </span>
                              </div>

                              <span className="text-[10px] font-medium text-slate-400">
                                Registrado por: <strong className="text-slate-600 dark:text-slate-300">{getActorBadge(event.actor)}</strong>
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              {event.title}
                            </h4>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROYECTOS & PIPELINE */}
            {activeTab === 'projects' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Proyectos Vinculados ({clientProjects.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Proyectos de desarrollo web, bastionado y consultoría para este cliente.
                    </p>
                  </div>

                  <Link
                    href="/projects"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Ir al Pipeline General →</span>
                  </Link>
                </div>

                {clientProjects.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    Este cliente no tiene proyectos activos en el pipeline actualmente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientProjects.map((p) => {
                      const progress = p.budget ? Math.round(((p.advancePaid || 0) / p.budget) * 100) : 0;
                      return (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {p.category.replace('_', ' ')}
                              </span>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                {p.name}
                              </h4>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                p.status === 'in_progress'
                                  ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                  : p.status === 'completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {p.status === 'in_progress' ? 'En Progreso' : p.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Presupuesto:</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {p.currency || 'PYG'} {(p.budget || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Anticipo:</span>
                              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                {p.currency || 'PYG'} {(p.advancePaid || 0).toLocaleString()} ({progress}%)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Pelota: {p.waitingOn === 'client' ? 'Cliente ⚠️' : 'Agencia'}
                            </span>
                            {p.driveUrl && (
                              <a
                                href={p.driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <Folder className="w-3 h-3" />
                                <span>Drive</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20 shadow-sm">
            Selecciona un cliente para visualizar su ficha 360°, línea de tiempo e infraestructura.
          </div>
        )}
      </div>

      {/* MODAL 1: Edit CRM Client Details */}
      {isClientDetailsModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Editar Datos CRM: {selectedClient.name}</span>
              </h3>
              <button onClick={() => setIsClientDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClientDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={editLegalName}
                    onChange={(e) => setEditLegalName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RUC Oficial</label>
                  <input
                    type="text"
                    placeholder="ej. 80017259-0"
                    value={editRuc}
                    onChange={(e) => setEditRuc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estado de Relación</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="active">Activo (En servicio)</option>
                    <option value="migrated">Migrado a Wix / Externo</option>
                    <option value="churned">Baja Histórica</option>
                    <option value="lead">Lead / En Negociación</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Canal de Captación</label>
                  <input
                    type="text"
                    placeholder="referral, direct, social"
                    value={editAcquisitionChannel}
                    onChange={(e) => setEditAcquisitionChannel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Enlace Google Drive</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={editDriveFolderUrl}
                    onChange={(e) => setEditDriveFolderUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClientDetailsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Timeline Event */}
      {isTimelineModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Registrar Hito en Línea de Tiempo</span>
              </h3>
              <button onClick={() => setIsTimelineModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTimelineEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Año</label>
                  <input
                    type="text"
                    required
                    value={eventYear}
                    onChange={(e) => setEventYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Fecha Específica (Opcional)</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Título del Hito</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Lanzamiento de Nueva Plataforma, Migración a Wix, Baja de Servicio"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipo de Evento</label>
                  <select
                    value={eventCategory}
                    onChange={(e: any) => setEventCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="milestone">Hito Clave / Lanzamiento</option>
                    <option value="upgrade">Renovación / Upgrade de Plan</option>
                    <option value="migration">Migración Externa (ej. Wix/Shopify)</option>
                    <option value="churn">Baja / Cancelación</option>
                    <option value="note">Nota Operativa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Registrado por</label>
                  <select
                    value={eventActor}
                    onChange={(e: any) => setEventActor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="rodney">Rodney (Director)</option>
                    <option value="ana">Ana (Comercial / Renovaciones)</option>
                    <option value="martin">Martín (Líder Técnico)</option>
                    <option value="diana">Diana (Administración)</option>
                    <option value="carla">Carla (Social Media)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Descripción / Contexto</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalles sobre lo ocurrido, motivos, decisiones o acuerdos con el cliente..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTimelineModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  Guardar Hito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Infrastructure Modal */}
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Editar Infraestructura: {selectedClient.name}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInfrastructure} className="space-y-5 text-xs">
              {/* Dominio */}
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Dominio</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={domainProvider}
                      onChange={(e) => setDomainProvider(e.target.value)}
                      placeholder="nic.py, GoDaddy"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Responsable Renovación</label>
                    <select
                      value={domainRenewer}
                      onChange={(e: any) => setDomainRenewer(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="agency">Impulsos Digitales (Agencia)</option>
                      <option value="client">El Cliente Directamente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={domainExpiry}
                      onChange={(e) => setDomainExpiry(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Costo Anual</label>
                    <input
                      type="number"
                      value={domainCost}
                      onChange={(e) => setDomainCost(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hosting */}
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">Hosting / Servidor</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={hostingProvider}
                      onChange={(e) => setHostingProvider(e.target.value)}
                      placeholder="Hosting Paraguay cPanel, Vercel, Render"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan / Capacidad</label>
                    <input
                      type="text"
                      value={hostingPlan}
                      onChange={(e) => setHostingPlan(e.target.value)}
                      placeholder="Shared Business 10GB"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Costo Anual</label>
                    <input
                      type="number"
                      value={hostingCost}
                      onChange={(e) => setHostingCost(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Moneda</label>
                    <select
                      value={hostingCurrency}
                      onChange={(e) => setHostingCurrency(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="PYG">PYG (Guaraníes)</option>
                      <option value="USD">USD (Dólares)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Correo y DNS */}
              <div className="space-y-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider">Correo y DNS</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gestión DNS</label>
                    <input
                      type="text"
                      value={dnsProvider}
                      onChange={(e) => setDnsProvider(e.target.value)}
                      placeholder="cPanel Host, Cloudflare"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Proveedor de Correo</label>
                    <input
                      type="text"
                      value={emailProvider}
                      onChange={(e) => setEmailProvider(e.target.value)}
                      placeholder="Google Workspace, Microsoft 365, cPanel"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Cuentas de Correo</label>
                    <input
                      type="number"
                      value={emailAccounts}
                      onChange={(e) => setEmailAccounts(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Costo Anual Correo</label>
                    <input
                      type="number"
                      value={emailCost}
                      onChange={(e) => setEmailCost(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded p-2 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer transition-colors shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Repar Soluciones Técnicas"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Razón Social</label>
                  <input
                    type="text"
                    placeholder="ej. Repar S.A."
                    value={newClientLegalName}
                    onChange={(e) => setNewClientLegalName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">RUC</label>
                  <input
                    type="text"
                    placeholder="80145000-3"
                    value={newClientRuc}
                    onChange={(e) => setNewClientRuc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@repar.com.py"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+595 981 112233"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estado</label>
                  <select
                    value={newClientStatus}
                    onChange={(e: any) => setNewClientStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="active">Activo</option>
                    <option value="lead">Lead / Prospecto</option>
                    <option value="migrated">Migrado a Wix</option>
                    <option value="churned">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Canal de Captación</label>
                  <select
                    value={newClientChannel}
                    onChange={(e) => setNewClientChannel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="referral">Referido / Recomendación</option>
                    <option value="direct">Directo / Prospección</option>
                    <option value="social">Redes Sociales / Web</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Carpeta Google Drive (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newClientDrive}
                  onChange={(e) => setNewClientDrive(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                >
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Manager Modal */}
      {selectedClient && (
        <GroupManagerModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          client={selectedClient}
          sites={currentSites}
          onGroupUpdated={async () => {
            router.refresh();
            try {
              const res = await fetch('/api/services');
              if (res.ok) {
                const fresh = await res.json();
                setCurrentSites(fresh);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* Team Snippets Modal */}
      <TeamSnippetsModal
        isOpen={isTeamSnippetsOpen}
        onClose={() => setIsTeamSnippetsOpen(false)}
        selectedClient={selectedClient}
      />
    </div>
  );
}
