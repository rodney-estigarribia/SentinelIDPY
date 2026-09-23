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
  Tag,
  Receipt,
  Smartphone,
  Check,
  UserCheck,
  Key,
  Shield,
  CreditCard,
  Filter,
  ArrowLeft,
  ChevronRight,
  Phone,
  ArrowRight
} from 'lucide-react';
import type { Client, Site, Project, ClientTimelineEvent, Payment } from '@/db/schema';
import { GroupManagerModal } from '@/components/services/group-manager-modal';
import { TeamSnippetsModal } from '@/components/team/team-snippets-modal';
import { Badge, Note } from '@/components/ui';

export const SERVICE_PACKAGES = [
  { id: 'mipyme_express', name: 'Mi Primera Web MiPyME Express', price: '₲610.000 / año (Lanzamiento Mano de Obra ₲0)', badge: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30' },
  { id: 'hardening', name: 'Hardening & Ciberseguridad', price: 'Desde ₲1.800.000 (One-off / Proyecto)', badge: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' },
  { id: 'cloud_infra', name: 'Cloud & Infraestructura', price: 'Desde ₲2.500.000', badge: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' },
  { id: 'mantenimiento_crecimiento', name: 'Plan Mantenimiento Crecimiento', price: '₲140.000 / mes', badge: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
  { id: 'mantenimiento_elite', name: 'Plan Mantenimiento Elite', price: '₲250.000 / mes', badge: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
  { id: 'custom', name: 'Desarrollo Web / Sistema a Medida', price: 'A cotizar', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
];

export function getServicePackageInfo(id?: string | null) {
  return SERVICE_PACKAGES.find(p => p.id === id) || SERVICE_PACKAGES.find(p => p.id === 'custom')!;
}

export function getClientTypeBadge(client: Client) {
  const isPotential = (client as any).clientType === 'potential' || client.status === 'lead';
  if (isPotential) {
    return {
      label: 'Potencial (Lead)',
      classes: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
      icon: '⚡'
    };
  }
  if (client.status === 'churned') {
    return {
      label: 'Baja Histórica',
      classes: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
      icon: '⚪'
    };
  }
  return {
    label: 'Cliente Real',
    classes: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    icon: '🟢'
  };
}

interface ClientsClientProps {
  initialClients: Client[];
  sites: Site[];
  initialProjects?: Project[];
  initialPayments?: Payment[];
}

export function ClientsClient({
  initialClients,
  sites,
  initialProjects = [],
  initialPayments = []
}: ClientsClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [currentSites, setCurrentSites] = useState<Site[]>(sites);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Active view tab (Apertura inmediata en Ficha CRM 360°)
  const [activeTab, setActiveTab] = useState<'ficha_crm' | 'infrastructure' | 'timeline' | 'projects' | 'payments' | 'web_config'>('ficha_crm');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'real' | 'potential' | 'churned'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Web Config & CTAs Editor State (Etapa 2)
  const [selectedConfigSiteId, setSelectedConfigSiteId] = useState<number | null>(null);
  const [cfgSlug, setCfgSlug] = useState('');
  const [cfgDemoActive, setCfgDemoActive] = useState(true);
  const [cfgProposalActive, setCfgProposalActive] = useState(true);
  const [cfgPortalEmail, setCfgPortalEmail] = useState('');
  const [cfgDemoStartDate, setCfgDemoStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cfgDemoDays, setCfgDemoDays] = useState(7);
  const [cfgPhone, setCfgPhone] = useState('');
  const [cfgDefaultMsg, setCfgDefaultMsg] = useState('');
  const [cfgReservationMsg, setCfgReservationMsg] = useState('');
  const [cfgCabanaMsg, setCfgCabanaMsg] = useState('');
  const [cfgCasonaMsg, setCfgCasonaMsg] = useState('');
  const [cfgPriceWeekday, setCfgPriceWeekday] = useState('');
  const [cfgPriceWeekend, setCfgPriceWeekend] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveStatus, setConfigSaveStatus] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isTeamSnippetsOpen, setIsTeamSnippetsOpen] = useState(false);
  const [isClientPaymentModalOpen, setIsClientPaymentModalOpen] = useState(false);

  // New Client Payment Form State
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayCurrency, setNewPayCurrency] = useState('PYG');
  const [newPayDate, setNewPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPayConcept, setNewPayConcept] = useState('mantenimiento_mensual');
  const [newPayDescription, setNewPayDescription] = useState('');
  const [newPayMethod, setNewPayMethod] = useState('transferencia');
  const [newPayReceipt, setNewPayReceipt] = useState('');
  const [newPayProjectId, setNewPayProjectId] = useState<number | ''>('');
  const [newPayNotes, setNewPayNotes] = useState('');
  const [isSavingPay, setIsSavingPay] = useState(false);

  useEffect(() => {
    setCurrentSites(sites);
  }, [sites]);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  useEffect(() => {
    if (!selectedClient) return;
    const clientSites = currentSites.filter((s) => s.clientId === selectedClient.id);
    const targetSite = clientSites.find(s => s.id === selectedConfigSiteId) || clientSites[0];
    if (targetSite) {
      setSelectedConfigSiteId(targetSite.id);
      const conf = (targetSite as any).siteConfig || {};
      const generatedSlug = conf.slug || targetSite.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setCfgSlug(generatedSlug);
      setCfgDemoActive(conf.demo?.active ?? (generatedSlug === 'cabana-del-arbol'));
      setCfgProposalActive(conf.proposal?.active ?? (generatedSlug === 'cabana-del-arbol'));
      setCfgPortalEmail(conf.portalEmail || selectedClient.email || '');
      setCfgDemoStartDate(conf.demo?.startDate || new Date().toISOString().split('T')[0]);
      setCfgDemoDays(conf.demo?.days || 7);
      setCfgPhone(conf.whatsapp?.phone || selectedClient.phone?.replace(/[^0-9]/g, '') || '595981000000');
      setCfgDefaultMsg(conf.whatsapp?.defaultMessage || '¡Hola! Quisiera consultar disponibilidad...');
      setCfgReservationMsg(conf.whatsapp?.reservationMessage || '¡Hola! Quiero consultar disponibilidad para reservar...');
      setCfgCabanaMsg(conf.whatsapp?.cabanaMessage || '');
      setCfgCasonaMsg(conf.whatsapp?.casonaMessage || '');
      setCfgPriceWeekday(conf.pricing?.cabana?.weekday || '1.300.000');
      setCfgPriceWeekend(conf.pricing?.cabana?.weekend || '1.500.000');
    } else {
      setSelectedConfigSiteId(null);
    }
  }, [selectedClient, selectedConfigSiteId, currentSites]);

  // Client Details Edit State
  const [editName, setEditName] = useState('');
  const [editLegalName, setEditLegalName] = useState('');
  const [editRuc, setEditRuc] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBillingEmail, setEditBillingEmail] = useState('');
  const [editPortalEmail, setEditPortalEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editClientType, setEditClientType] = useState<'real' | 'potential'>('real');
  const [editServicePackage, setEditServicePackage] = useState('custom');
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
  const [newClientBillingEmail, setNewClientBillingEmail] = useState('');
  const [newClientPortalEmail, setNewClientPortalEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<'active' | 'migrated' | 'churned' | 'lead'>('active');
  const [newClientType, setNewClientType] = useState<'real' | 'potential'>('real');
  const [newClientServicePackage, setNewClientServicePackage] = useState('custom');
  const [newClientChannel, setNewClientChannel] = useState('direct');
  const [newClientDrive, setNewClientDrive] = useState('');

  const clientSites = selectedClient
    ? currentSites.filter((s) => s.clientId === selectedClient.id)
    : [];

  const clientProjects = selectedClient
    ? projects.filter((p) => p.clientId === selectedClient.id)
    : [];

  const clientPayments = selectedClient
    ? payments.filter((p) => p.clientId === selectedClient.id)
    : [];

  const handleCreateClientPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newPayAmount || isNaN(Number(newPayAmount))) {
      alert('Ingresa un monto numérico válido');
      return;
    }

    setIsSavingPay(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          projectId: newPayProjectId ? Number(newPayProjectId) : null,
          amount: Number(newPayAmount),
          currency: newPayCurrency,
          date: newPayDate,
          concept: newPayConcept,
          description: newPayDescription,
          paymentMethod: newPayMethod,
          receiptNumber: newPayReceipt,
          status: 'completed',
          notes: newPayNotes,
        })
      });

      if (!res.ok) throw new Error('Error al registrar el cobro');
      const saved = await res.json();
      setPayments((prev) => [saved, ...prev]);
      setIsClientPaymentModalOpen(false);

      setNewPayAmount('');
      setNewPayDescription('');
      setNewPayReceipt('');
      setNewPayNotes('');
      setNewPayProjectId('');
    } catch (err) {
      console.error(err);
      alert('No se pudo registrar el cobro');
    } finally {
      setIsSavingPay(false);
    }
  };

  const handleDeleteClientPayment = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cobro?')) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el registro');
    }
  };

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
    setActiveTab('ficha_crm');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/clients?id=${c.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const handleBackToList = () => {
    setSelectedClient(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/clients');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sync URL query params on mount and browser navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      const hash = window.location.hash;
      const hashId = hash.startsWith('#client-') ? hash.replace('#client-', '') : null;
      const targetId = idParam || hashId;

      if (targetId) {
        const found = clients.find((c) => c.id === parseInt(targetId, 10));
        if (found) {
          handleSelectClient(found);
        }
      } else {
        setSelectedClient(null);
      }
    };

    syncFromUrl();

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [clients]);

  const openClientDetailsModal = () => {
    if (!selectedClient) return;
    setEditName(selectedClient.name);
    setEditLegalName(selectedClient.legalName || '');
    setEditRuc(selectedClient.ruc || '');
    setEditCompany(selectedClient.company || '');
    setEditEmail(selectedClient.email || '');
    setEditBillingEmail((selectedClient as any).billingEmail || '');
    setEditPortalEmail((selectedClient as any).portalEmail || '');
    setEditPhone(selectedClient.phone || '');
    setEditStatus(selectedClient.status || 'active');
    setEditClientType((selectedClient as any).clientType || (selectedClient.status === 'lead' ? 'potential' : 'real'));
    setEditServicePackage((selectedClient as any).servicePackage || 'custom');
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
      clientType: editClientType,
      servicePackage: editServicePackage,
      billingEmail: editBillingEmail || null,
      portalEmail: editPortalEmail || null,
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

  const handleSaveWebConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfigSiteId || !cfgSlug) return;
    setIsSavingConfig(true);
    setConfigSaveStatus(null);

    const payload = {
      slug: cfgSlug,
      demo: {
        active: cfgDemoActive,
        startDate: cfgDemoStartDate,
        days: Number(cfgDemoDays)
      },
      proposal: {
        active: cfgProposalActive
      },
      portalEmail: cfgPortalEmail,
      whatsapp: {
        phone: cfgPhone,
        defaultMessage: cfgDefaultMsg,
        reservationMessage: cfgReservationMsg,
        cabanaMessage: cfgCabanaMsg,
        casonaMessage: cfgCasonaMsg
      },
      pricing: {
        cabana: {
          name: 'La Cabaña',
          weekday: cfgPriceWeekday,
          weekend: cfgPriceWeekend
        }
      }
    };

    try {
      const res = await fetch(`/api/sites/${cfgSlug}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setConfigSaveStatus('✅ ¡Configuración y CTAs actualizados en Neon Postgres!');
        setCurrentSites((prev) =>
          prev.map((s) => (s.id === selectedConfigSiteId ? ({ ...s, siteConfig: payload } as any) : s))
        );
      } else {
        setConfigSaveStatus('❌ Error al guardar la configuración.');
      }
    } catch (err) {
      console.error('Error saving web config:', err);
      setConfigSaveStatus('❌ Error de conexión al guardar.');
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setConfigSaveStatus(null), 4000);
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
      clientType: newClientType,
      servicePackage: newClientServicePackage,
      billingEmail: newClientBillingEmail || null,
      portalEmail: newClientPortalEmail || null,
      billingDetails: null,
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
    setNewClientBillingEmail('');
    setNewClientPortalEmail('');
    setNewClientPhone('');
    setNewClientDrive('');

    try {
      const res = await fetch('/api/clients', {
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

  const totalCount = clients.length;
  const realCount = clients.filter(c => ((c as any).clientType === 'real' || !(c as any).clientType) && c.status !== 'lead' && c.status !== 'churned').length;
  const potentialCount = clients.filter(c => (c as any).clientType === 'potential' || c.status === 'lead').length;
  const churnedCount = clients.filter(c => c.status === 'churned').length;

  // Filter clients by search query, client type, and service package
  const filteredClients = clients.filter((c) => {
    // 1. Client Type filter
    if (clientTypeFilter === 'real') {
      const isPot = (c as any).clientType === 'potential' || c.status === 'lead';
      const isChurn = c.status === 'churned';
      if (isPot || isChurn) return false;
    } else if (clientTypeFilter === 'potential') {
      const isPot = (c as any).clientType === 'potential' || c.status === 'lead';
      if (!isPot) return false;
    } else if (clientTypeFilter === 'churned') {
      if (c.status !== 'churned') return false;
    }

    // 2. Service Package filter
    if (serviceFilter !== 'all') {
      const pkg = (c as any).servicePackage || 'custom';
      if (pkg !== serviceFilter) return false;
    }

    // 3. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.legalName && c.legalName.toLowerCase().includes(q)) ||
      (c.ruc && c.ruc.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (Boolean((c as any).billingEmail) && (c as any).billingEmail.toLowerCase().includes(q)) ||
      (Boolean((c as any).portalEmail) && (c as any).portalEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {!selectedClient ? (
        /* VISTA LISTA COMPLETA */
        <div className="space-y-6">
          {/* Header & Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Directorio de Clientes CRM 360°</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestión de cuentas comerciales, perfiles fiscales, infraestructura de hosting y activos web.
              </p>
            </div>

            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Cartera
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {totalCount}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Cuentas registradas</span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                <span>🟢</span> Clientes Reales
              </span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                {realCount}
              </span>
              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">Servicio activo / recurrente</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                <span>⚡</span> Leads & Demos
              </span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">
                {potentialCount}
              </span>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">En negociación o demo 7d</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Activos / Sitios
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {sites.length}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Websites vinculados</span>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setClientTypeFilter('all')}
                  className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    clientTypeFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({totalCount})
                </button>
                <button
                  onClick={() => setClientTypeFilter('real')}
                  className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    clientTypeFilter === 'real'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🟢</span> Reales ({realCount})
                </button>
                <button
                  onClick={() => setClientTypeFilter('potential')}
                  className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    clientTypeFilter === 'potential'
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>⚡</span> Leads ({potentialCount})
                </button>
                <button
                  onClick={() => setClientTypeFilter('churned')}
                  className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    clientTypeFilter === 'churned'
                      ? 'bg-rose-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Bajas ({churnedCount})
                </button>
              </div>

              {/* Service Package Filter */}
              <div className="w-full md:w-80">
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 shadow-xs cursor-pointer"
                >
                  <option value="all">📦 Filtrar por paquete de servicio (Todos)</option>
                  {SERVICE_PACKAGES.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre de cliente, RUC, razón social, empresa, correo general o portal magic link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Directory Grid / Cards */}
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-3">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No se encontraron clientes
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No hay resultados con los criterios de búsqueda o filtros actuales.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setClientTypeFilter('all');
                  setServiceFilter('all');
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((c) => {
                const cSites = sites.filter((s) => s.clientId === c.id);
                const cProjects = projects.filter((p) => p.clientId === c.id);
                const typeBadge = getClientTypeBadge(c);
                const pkgInfo = getServicePackageInfo((c as any).servicePackage);
                const hasAgencyCard = cSites.some((s) => s.billing?.responsibility === 'tc_agencia');

                // Initials for avatar
                const initials = c.name
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'CL';

                return (
                  <div
                    key={c.id}
                    id={`client-${c.id}`}
                    onClick={() => handleSelectClient(c)}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {c.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {c.legalName || c.company || 'Empresa / Particular'}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${typeBadge.classes}`}>
                          {typeBadge.icon} {typeBadge.label}
                        </span>
                      </div>

                      {/* Package Badge */}
                      <div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border inline-block max-w-full truncate ${pkgInfo.badge}`}>
                          📦 {pkgInfo.name}
                        </span>
                      </div>

                      {/* Fiscal & Contact Info */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        {c.ruc && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>RUC: {c.ruc}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {(c as any).portalEmail ? (
                            <span className="font-mono text-cyan-600 dark:text-cyan-400 truncate" title={`Portal Magic Link: ${(c as any).portalEmail}`}>
                              🔑 {(c as any).portalEmail}
                            </span>
                          ) : (
                            <span className="truncate">{c.email || 'Sin correo registrado'}</span>
                          )}
                        </div>

                        {c.phone && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cSites.length} {cSites.length === 1 ? 'sitio' : 'sitios'}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cProjects.length} proy
                        </span>
                        {hasAgencyCard && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                            TC Rodney ⚠️
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Ver Ficha 360°</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VISTA FICHA CRM 360 COMPLETA */
        <div className="space-y-6">
          {/* Top Bar: Volver a la Lista + Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:text-white transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Volver a la Lista de Clientes</span>
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Directorio CRM / <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedClient.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">Cambiar cliente:</span>
              <select
                value={selectedClient.id}
                onChange={(e) => {
                  const nextId = parseInt(e.target.value, 10);
                  const nextClient = clients.find((c) => c.id === nextId);
                  if (nextClient) handleSelectClient(nextClient);
                }}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({getClientTypeBadge(c).label})
                  </option>
                ))}
              </select>
            </div>
          </div>
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
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-semibold overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab('ficha_crm')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'ficha_crm'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Ficha CRM (360°)</span>
              </button>

              <button
                onClick={() => setActiveTab('infrastructure')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
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
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
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
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Proyectos Pipeline ({clientProjects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'payments'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Pagos & Cobros ({clientPayments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('web_config')}
                className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'web_config'
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Configuración Web & CTAs (Etapa 2)</span>
              </button>
            </div>

            {/* TAB 0: FICHA CRM (360°) */}
            {activeTab === 'ficha_crm' && (
              <div className="space-y-6 animate-in fade-in">
                {/* 1. Banner de Oferta & Paquete Asociado */}
                {(() => {
                  const pkg = getServicePackageInfo((selectedClient as any).servicePackage);
                  const isPotential = (selectedClient as any).clientType === 'potential' || selectedClient.status === 'lead';
                  const typeBadge = getClientTypeBadge(selectedClient);

                  return (
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Paquete / Oferta Asignada
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeBadge.classes}`}>
                              {typeBadge.icon} {typeBadge.label}
                            </span>
                            {isPotential && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                ⏳ Periodo de Prueba / Negociación Activo
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{pkg.name}</span>
                          </h3>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                              Tarifa / Arancel: {pkg.price}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                            {pkg.id === 'mipyme_express' ? (
                              <span>
                                🚀 <strong>Propuesta Express:</strong> Creación de web + Google Maps + presencia digital con IA en 24h. 7 días de prueba sin costo de desarrollo (Mano de obra ₲0). Si el cliente aprueba, abona <strong>₲610.000/año</strong> por dominio, hosting y seguridad continua.
                              </span>
                            ) : pkg.id === 'hardening' ? (
                              <span>
                                🛡️ <strong>Hardening & Ciberseguridad:</strong> Auditoría de seguridad perimetral, cierre de vectores expuestos, gestión de accesos y protección de activos empresariales (Desde ₲1.800.000).
                              </span>
                            ) : pkg.id === 'cloud_infra' ? (
                              <span>
                                ☁️ <strong>Cloud & Infraestructura:</strong> Arquitectura en nube, servidores dedicados/VPS, migración y estabilidad de misión crítica (Desde ₲2.500.000).
                              </span>
                            ) : (
                              <span>
                                💼 <strong>Servicio Especializado:</strong> Configuración y mantenimiento gestionado por Rodney / Impulsos Digitales.
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                          <button
                            onClick={openClientDetailsModal}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Modificar Oferta / Tipo</span>
                          </button>

                          {clientSites.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedConfigSiteId(clientSites[0].id);
                                setActiveTab('web_config');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Configurar Web & CTAs</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Grid 2 Columnas: Tarjetas Separadas de Facturación Legal vs Acceso a Portal & Analítica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TARJETA 1: INFORMACIÓN DE FACTURACIÓN LEGAL & FISCAL */}
                  <div className="p-5 rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-500/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              Facturación Legal & Fiscal
                            </h4>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              SET / Impuestos / Liquidaciones
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                          Contabilidad
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-700/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="leading-snug">
                          <strong>Aislamiento Contable:</strong> Este correo recibe facturas oficiales y estados de cobro. <u>NO</u> tiene acceso ni permisos para ver métricas de analítica web.
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500 dark:text-slate-400">Razón Social:</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {selectedClient.legalName || 'No especificada'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500 dark:text-slate-400">RUC Legal:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {selectedClient.ruc || 'Sin RUC'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500 dark:text-slate-400">Correo de Facturación (Receptor Legal):</span>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-mono font-semibold text-slate-900 dark:text-white truncate">
                              {(selectedClient as any).billingEmail || selectedClient.email || 'Sin correo de facturación'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-500 dark:text-slate-400">Condición de Cobro:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {(selectedClient as any).billingDetails?.paymentTerms || 'Contado / Anticipado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={openClientDetailsModal}
                      className="w-full py-2 px-3 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100/50 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Actualizar Info Contable & RUC</span>
                    </button>
                  </div>

                  {/* TARJETA 2: ACCESO A PORTAL & ANALÍTICA WEB */}
                  <div className="p-5 rounded-2xl border border-cyan-200/80 dark:border-cyan-500/30 bg-cyan-50/20 dark:bg-cyan-950/10 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-cyan-200/60 dark:border-cyan-500/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                            <Key className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              Acceso a Portal & Analítica Web
                            </h4>
                            <p className="text-[10px] text-cyan-700 dark:text-cyan-400 font-medium">
                              Magic Link 7 Días (/portal)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                          Cliente Web
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cyan-100/60 dark:bg-cyan-900/30 border border-cyan-200/80 dark:border-cyan-700/40 text-[11px] text-cyan-900 dark:text-cyan-200 flex items-start gap-2">
                        <Key className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400 shrink-0 mt-0.5" />
                        <p className="leading-snug">
                          <strong>Acceso Exclusivo de Métricas:</strong> Este correo permite ingresar a <code>/portal</code> sin contraseña para ver visitas y clics de WhatsApp. <u>NO</u> accede a facturas ni otros clientes.
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                        <div className="flex flex-col gap-1 py-1 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500 dark:text-slate-400">Correo Habilitado para Magic Link:</span>
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                              {(selectedClient as any).portalEmail || '⚠️ Sin correo de portal (Configurar)'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 py-1 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-slate-500 dark:text-slate-400">Sitio(s) Vinculado(s):</span>
                          {clientSites.length === 0 ? (
                            <p className="text-slate-400 italic">No tiene sitios asignados todavía.</p>
                          ) : (
                            clientSites.map((site) => (
                              <div key={site.id} className="flex items-center justify-between text-xs py-0.5">
                                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                                  {site.name}
                                </span>
                                {site.url && (
                                  <a
                                    href={`${site.url.replace(/\/$/, '')}/portal`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                                  >
                                    <span>Abrir /portal</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-500 dark:text-slate-400">Duración de Sesión:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            7 Días (Sesión Local Persistente)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={openClientDetailsModal}
                        className="flex-1 py-2 px-3 rounded-xl border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Cambiar Correo Portal</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('web_config')}
                        className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ajustar CTAs</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* TARJETA 3 & 4: Contacto Comercial y Resumen Operativo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contacto Comercial & Operativo */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Contacto Comercial & Operativo
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Responsable / Dueño:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedClient.name}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Teléfono / WhatsApp:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900 dark:text-white">
                            {selectedClient.phone || 'Sin teléfono'}
                          </span>
                          {selectedClient.phone && (
                            <a
                              href={`https://wa.me/${selectedClient.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500 dark:text-slate-400">Correo Principal / Contacto:</span>
                        <span className="font-mono text-slate-900 dark:text-white truncate max-w-[200px]">
                          {selectedClient.email || 'Sin correo'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Canal de Captación:</span>
                        <span className="capitalize font-semibold text-slate-900 dark:text-white">
                          {selectedClient.acquisitionChannel || 'direct'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Operativo & Pipeline */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                      <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Resumen de Pipeline & Cobranzas
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div
                        onClick={() => setActiveTab('infrastructure')}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                          Servicios / Activos
                        </span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {clientSites.length}
                        </span>
                      </div>

                      <div
                        onClick={() => setActiveTab('projects')}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                          Proyectos Pipeline
                        </span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {clientProjects.length}
                        </span>
                      </div>

                      <div
                        onClick={() => setActiveTab('payments')}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                          Cobros Registrados
                        </span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {clientPayments.length}
                        </span>
                      </div>

                      <div
                        onClick={() => setActiveTab('timeline')}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                          Hitos en Línea
                        </span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedClient.timeline?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* TAB 4: PAYMENTS & BILLING */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Header with KPI chips & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      <span>Cobros y Facturación de {selectedClient.name}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Historial completo de pagos percibidos, facturas emitidas y anticipos de proyectos.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Percibido</span>
                      <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        ₲ {clientPayments
                          .filter((p) => p.status === 'completed' && (p.currency || 'PYG') === 'PYG')
                          .reduce((s, p) => s + (p.amount || 0), 0)
                          .toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsClientPaymentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Cobro</span>
                    </button>
                  </div>
                </div>

                {/* Table of payments */}
                {clientPayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">No hay cobros registrados para este cliente aún.</p>
                    <button
                      type="button"
                      onClick={() => setIsClientPaymentModalOpen(true)}
                      className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      + Registrar el primer pago
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Concepto & Descripción</th>
                          <th className="px-4 py-3">Factura / Recibo</th>
                          <th className="px-4 py-3">Medio</th>
                          <th className="px-4 py-3 text-right">Monto</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                          <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {clientPayments.map((p) => {
                          const project = clientProjects.find((pr) => pr.id === p.projectId);

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                              <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {p.date}
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  {p.concept.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                {p.description && (
                                  <div className="text-[11px] text-slate-500 truncate" title={p.description}>
                                    {p.description}
                                  </div>
                                )}
                                {project && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                                    <Briefcase className="w-2.5 h-2.5" />
                                    {project.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {p.receiptNumber || '—'}
                              </td>
                              <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {p.paymentMethod}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {p.currency || 'PYG'} {(p.amount || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    p.status === 'completed'
                                      ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                                      : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20'
                                  }`}
                                >
                                  {p.status === 'completed' ? 'Cobrado' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClientPayment(p.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: WEB CONFIG & CTAs (ETAPA 2) */}
            {activeTab === 'web_config' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-5">
                  <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span>Gestor Visual de CTAs y Parámetros Web (Etapa 2)</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Controlá en tiempo real los mensajes de WhatsApp, estado de la demo y tarifas sin tocar código.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedClient && (
                        <a
                          href={`/api/sites/${cfgSlug}/config`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver API JSON</span>
                        </a>
                      )}
                      {clientSites[0]?.url && (
                        <a
                          href={`${clientSites[0].url.replace(/\/$/, '')}/portal`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir /portal del Cliente</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {configSaveStatus && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      {configSaveStatus}
                    </div>
                  )}

                  <form onSubmit={handleSaveWebConfig} className="space-y-6 text-xs">
                    {/* Sitio y Slug */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Sitio Web Asignado
                        </label>
                        <select
                          value={selectedConfigSiteId || ''}
                          onChange={(e) => setSelectedConfigSiteId(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {clientSites.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.type}) — {s.url}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Slug Identificador (Tracker / API)
                        </label>
                        <input
                          type="text"
                          value={cfgSlug}
                          onChange={(e) => setCfgSlug(e.target.value)}
                          placeholder="ej. cabana-del-arbol"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Bloque 1: Control de Demo y Temporizador */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>Modo Demo & Cuenta Regresiva (7 Días)</span>
                        </span>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfgDemoActive}
                            onChange={(e) => setCfgDemoActive(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {cfgDemoActive ? 'Demo Activa (con banner y bloqueo)' : 'Sitio Definitivo (Sin banner)'}
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Fecha de Inicio de Demo</label>
                          <input
                            type="date"
                            value={cfgDemoStartDate}
                            onChange={(e) => setCfgDemoStartDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Días de Vigencia</label>
                          <input
                            type="number"
                            value={cfgDemoDays}
                            onChange={(e) => setCfgDemoDays(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 1.5: Control de Propuesta Comercial (/propuesta) */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>Página de Propuesta Comercial (/propuesta)</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Si está inactiva (OFF), cualquier visita a /propuesta se redirige al inicio (ideal cuando ya se cerró la venta o venció la oferta).
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={cfgProposalActive}
                            onChange={(e) => setCfgProposalActive(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfgProposalActive ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                            {cfgProposalActive ? 'Visible (ON)' : 'Oculta / Redirigida (OFF)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Bloque 1.8: Correo(s) Autorizado(s) para el Portal (/portal) */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-500" />
                          <span>Acceso al Portal del Cliente (/portal)</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                          Magic Link 7 Días
                        </span>
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                          Correo(s) Electrónico(s) Autorizado(s)
                        </label>
                        <input
                          type="text"
                          value={cfgPortalEmail}
                          onChange={(e) => setCfgPortalEmail(e.target.value)}
                          placeholder="ej. reservas@cabanadelarbol.com.py (o varios correos separados por coma)"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Este correo podrá entrar a <code>/portal</code> con el enlace mágico sin contraseña. Si el cliente tiene socios o encargados, podés escribir varios correos separados por coma.
                        </p>
                      </div>
                    </div>

                    {/* Bloque 2: WhatsApp & Concierge */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <span>Teléfono y Mensajes de WhatsApp</span>
                      </span>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                            Número de WhatsApp Comercial (Código de país sin espacios)
                          </label>
                          <input
                            type="text"
                            value={cfgPhone}
                            onChange={(e) => setCfgPhone(e.target.value)}
                            placeholder="595982957509"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                            Mensaje por Defecto (Botón Flotante / General)
                          </label>
                          <textarea
                            value={cfgDefaultMsg}
                            onChange={(e) => setCfgDefaultMsg(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                            Mensaje de Reserva Estructurado
                          </label>
                          <textarea
                            value={cfgReservationMsg}
                            onChange={(e) => setCfgReservationMsg(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bloque 3: Tarifas Rápidas */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>Tarifas Principales (Gs.)</span>
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Tarifa Entre Semana (Gs.)</label>
                          <input
                            type="text"
                            value={cfgPriceWeekday}
                            onChange={(e) => setCfgPriceWeekday(e.target.value)}
                            placeholder="1.300.000"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Tarifa Fin de Semana (Gs.)</label>
                          <input
                            type="text"
                            value={cfgPriceWeekend}
                            onChange={(e) => setCfgPriceWeekend(e.target.value)}
                            placeholder="1.500.000"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSavingConfig || !selectedConfigSiteId}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingConfig ? 'Guardando en Base de Datos...' : 'Guardar Configuración en Neon Postgres'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

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

              {/* Categorización CRM: Real vs Potencial & Paquete de Servicio */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={editClientType}
                    onChange={(e: any) => setEditClientType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="real">🟢 Cliente Real (Activo / Retenido)</option>
                    <option value="potential">⚡ Cliente Potencial (Lead / Demo 7 Días)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Permite filtrar leads de prospección vs clientes que pagan.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Paquete / Servicio Asociado
                  </label>
                  <select
                    value={editServicePackage}
                    onChange={(e) => setEditServicePackage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    {SERVICE_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block truncate">
                    {getServicePackageInfo(editServicePackage).price}
                  </span>
                </div>
              </div>

              {/* Separación Estricta: Facturación Legal vs Acceso a Portal & Analítica */}
              <div className="space-y-3 p-3 rounded-xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/30">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Separación de Correos (Facturación vs Analítica Portal)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-0.5">
                      Correo de Facturación (Legal / SET)
                    </label>
                    <input
                      type="email"
                      placeholder="facturacion@empresa.com.py"
                      value={editBillingEmail}
                      onChange={(e) => setEditBillingEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/40 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Para facturas oficiales. <u>Sin</u> acceso a analítica.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-0.5">
                      Correo Acceso Portal (/portal)
                    </label>
                    <input
                      type="email"
                      placeholder="admin@empresa.com.py"
                      value={editPortalEmail}
                      onChange={(e) => setEditPortalEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-500/40 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Magic link 7 días para ver métricas. <u>Sin</u> datos de facturación.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Correo General de Contacto</label>
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

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={newClientType}
                    onChange={(e: any) => setNewClientType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="real">🟢 Cliente Real (Activo / Retenido)</option>
                    <option value="potential">⚡ Cliente Potencial (Lead / Demo 7 Días)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Servicio / Oferta Asociada
                  </label>
                  <select
                    value={newClientServicePackage}
                    onChange={(e) => setNewClientServicePackage(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-white font-medium"
                  >
                    {SERVICE_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Separación de Correos: Facturación vs Acceso a Portal */}
              <div className="space-y-3 p-3 rounded-xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/30">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Separación de Correos (Facturación vs Portal Analítica)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-0.5">
                      Correo Facturación (Legal)
                    </label>
                    <input
                      type="email"
                      placeholder="facturacion@empresa.com.py"
                      value={newClientBillingEmail}
                      onChange={(e) => setNewClientBillingEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/40 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Receptor de facturas.
                    </p>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-0.5">
                      Correo Portal (/portal)
                    </label>
                    <input
                      type="email"
                      placeholder="admin@empresa.com.py"
                      value={newClientPortalEmail}
                      onChange={(e) => setNewClientPortalEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-500/40 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Magic link analíticas.
                    </p>
                  </div>
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

      {/* Modal: Registrar Cobro para el Cliente Seleccionado */}
      {isClientPaymentModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Registrar Cobro: {selectedClient.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Asienta un pago directo percibido para este cliente.
                </p>
              </div>
              <button
                onClick={() => setIsClientPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClientPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Proyecto Vinculado (Opcional)
                </label>
                <select
                  value={newPayProjectId}
                  onChange={(e) => setNewPayProjectId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Ninguno / Pago de Mantenimiento o Servicio General</option>
                  {clientProjects.map((pr) => (
                    <option key={pr.id} value={pr.id}>{pr.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Cobrado *
                  </label>
                  <input
                    type="number"
                    value={newPayAmount}
                    onChange={(e) => setNewPayAmount(e.target.value)}
                    placeholder="Ej. 250000"
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Moneda
                  </label>
                  <select
                    value={newPayCurrency}
                    onChange={(e) => setNewPayCurrency(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="PYG">PYG (₲ Guaraníes)</option>
                    <option value="USD">USD ($ Dólares)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Cobro *
                  </label>
                  <input
                    type="date"
                    value={newPayDate}
                    onChange={(e) => setNewPayDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Concepto
                  </label>
                  <select
                    value={newPayConcept}
                    onChange={(e) => setNewPayConcept(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="mantenimiento_mensual">Mantenimiento Mensual</option>
                    <option value="anticipo_proyecto">Anticipo Proyecto (50%)</option>
                    <option value="saldo_proyecto">Saldo de Entrega Proyecto</option>
                    <option value="renovacion_anual">Renovación Dominio / Hosting</option>
                    <option value="consultoria">Consultoría / TI</option>
                    <option value="otro">Otro Servicio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={newPayMethod}
                    onChange={(e) => setNewPayMethod(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta / Pasarela</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Factura / Comprobante
                  </label>
                  <input
                    type="text"
                    value={newPayReceipt}
                    onChange={(e) => setNewPayReceipt(e.target.value)}
                    placeholder="Ej. FAC-2026-027"
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Detalle
                </label>
                <input
                  type="text"
                  value={newPayDescription}
                  onChange={(e) => setNewPayDescription(e.target.value)}
                  placeholder="Ej. Cuota Mantenimiento Plan Elite Septiembre"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClientPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPay}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingPay ? 'Registrando...' : 'Registrar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
