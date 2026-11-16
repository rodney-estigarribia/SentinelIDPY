'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Folder,
  ExternalLink,
  DollarSign,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Trash2,
  Edit2,
  X,
  Building,
  ShieldCheck,
  Globe,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import type { Project, Client } from '@/db/schema';
import { TeamSnippetsModal } from '@/components/team/team-snippets-modal';

interface ProjectsClientProps {
  initialProjects: Project[];
  clients: Client[];
}

export function ProjectsClient({ initialProjects, clients }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWaitingOn, setFilterWaitingOn] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isTeamSnippetsOpen, setIsTeamSnippetsOpen] = useState(false);
  const [selectedClientForSnippets, setSelectedClientForSnippets] = useState<Client | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<number>(clients[0]?.id || 1);
  const [category, setCategory] = useState('web_corp');
  const [status, setStatus] = useState('pending');
  const [waitingOn, setWaitingOn] = useState('agency');
  const [budget, setBudget] = useState(2500000);
  const [currency, setCurrency] = useState('PYG');
  const [advancePaid, setAdvancePaid] = useState(1250000);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('2026-10-30');
  const [notes, setNotes] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [assignedRole, setAssignedRole] = useState('martin');

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setClientId(clients[0]?.id || 1);
    setCategory('web_corp');
    setStatus('pending');
    setWaitingOn('agency');
    setBudget(2500000);
    setCurrency('PYG');
    setAdvancePaid(1250000);
    setTargetDeliveryDate('2026-10-30');
    setNotes('');
    setDriveUrl('');
    setAssignedRole('martin');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setClientId(p.clientId || clients[0]?.id || 1);
    setCategory(p.category);
    setStatus(p.status);
    setWaitingOn(p.waitingOn || 'agency');
    setBudget(p.budget || 0);
    setCurrency(p.currency || 'PYG');
    setAdvancePaid(p.advancePaid || 0);
    setTargetDeliveryDate(p.targetDeliveryDate || '');
    setNotes(p.notes || '');
    setDriveUrl(p.driveUrl || '');
    setAssignedRole(p.assignedRole || 'martin');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      clientId: Number(clientId),
      name,
      category,
      status,
      waitingOn,
      budget: Number(budget),
      currency,
      advancePaid: Number(advancePaid),
      targetDeliveryDate,
      notes,
      driveUrl,
      assignedRole,
    };

    if (editingProject) {
      try {
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
        } else {
          // In-memory fallback update
          setProjects(projects.map((p) => (p.id === editingProject.id ? { ...p, ...payload } : p)));
        }
      } catch {
        setProjects(projects.map((p) => (p.id === editingProject.id ? { ...p, ...payload } : p)));
      }
    } else {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProjects([...projects, created]);
        } else {
          const fakeCreated: Project = {
            id: Math.max(0, ...projects.map((p) => p.id)) + 1,
            ...payload,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setProjects([...projects, fakeCreated]);
        }
      } catch {
        const fakeCreated: Project = {
          id: Math.max(0, ...projects.map((p) => p.id)) + 1,
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProjects([...projects, fakeCreated]);
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('¿Seguro de que deseas eliminar este proyecto del pipeline?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
    setProjects(projects.filter((p) => p.id !== id));
  };

  const handleToggleWaitingOn = async (p: Project) => {
    const nextWaitingOn = p.waitingOn === 'client' ? 'agency' : 'client';
    const updated = { ...p, waitingOn: nextWaitingOn };
    setProjects(projects.map((item) => (item.id === p.id ? updated : item)));

    try {
      await fetch(`/api/projects/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitingOn: nextWaitingOn }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (p: Project, nextStatus: string) => {
    const updated = { ...p, status: nextStatus };
    setProjects(projects.map((item) => (item.id === p.id ? updated : item)));

    try {
      await fetch(`/api/projects/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalPipeline = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalAdvance = projects.reduce((acc, p) => acc + (p.advancePaid || 0), 0);
  const pendingCollection = Math.max(0, totalPipeline - totalAdvance);
  const waitingOnClientCount = projects.filter((p) => p.waitingOn === 'client' && p.status !== 'completed').length;

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (filterWaitingOn !== 'all' && p.waitingOn !== filterWaitingOn) return false;
    return true;
  });

  // Group into Kanban columns
  const pendingClientProjects = filteredProjects.filter(
    (p) => p.status === 'pending' && p.waitingOn === 'client'
  );
  const pendingAgencyProjects = filteredProjects.filter(
    (p) => p.status === 'pending' && p.waitingOn === 'agency'
  );
  const inProgressProjects = filteredProjects.filter((p) => p.status === 'in_progress');
  const completedProjects = filteredProjects.filter((p) => p.status === 'completed');

  const getClient = (cId: number | null) => clients.find((c) => c.id === cId);

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'ana':
        return { label: 'Ana (Comercial)', bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' };
      case 'martin':
        return { label: 'Martín (Técnico)', bg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' };
      case 'diana':
        return { label: 'Diana (Admin)', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' };
      case 'carla':
        return { label: 'Carla (Social)', bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' };
      default:
        return { label: 'Rodney', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'web_corp':
        return 'Web Corporativa';
      case 'web_pymes':
        return 'Mi Primera Web MiPyME';
      case 'security':
        return 'Hardening & Ciberseguridad';
      case 'cloud':
        return 'Cloud & M365';
      case 'automation':
        return 'Automatización IA';
      case 'mobile_app':
        return 'App Móvil / Sistema';
      case 'consulting':
        return 'Consultoría TI';
      default:
        return cat;
    }
  };

  const renderProjectCard = (p: Project) => {
    const client = getClient(p.clientId);
    const role = getRoleBadge(p.assignedRole);
    const progressPercent = p.budget ? Math.round(((p.advancePaid || 0) / p.budget) * 100) : 0;

    return (
      <div
        key={p.id}
        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {getCategoryLabel(p.category)}
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 leading-snug">
              {p.name}
            </h4>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openEditModal(p)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              title="Editar proyecto"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteProject(p.id)}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Eliminar proyecto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Client Tag */}
        {client && (
          <div className="flex items-center justify-between text-xs">
            <Link
              href={`/clients#client-${client.id}`}
              className="font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{client.name}</span>
            </Link>

            <button
              onClick={() => {
                setSelectedClientForSnippets(client);
                setIsTeamSnippetsOpen(true);
              }}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              title="Abrir mensajes y copys para este cliente"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Mensaje</span>
            </button>
          </div>
        )}

        {/* Financial info & advance bar */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-slate-400">Presupuesto:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {p.currency || 'PYG'} {(p.budget || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">Anticipo recibido:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {p.currency || 'PYG'} {(p.advancePaid || 0).toLocaleString()} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progressPercent >= 100
                  ? 'bg-emerald-500'
                  : progressPercent > 0
                  ? 'bg-blue-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Notes / Description */}
        {p.notes && (
          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed italic">
            "{p.notes}"
          </p>
        )}

        {/* Meta row: Waiting on & Assigned Role */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => handleToggleWaitingOn(p)}
            className={`text-[10px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 transition-colors cursor-pointer ${
              p.waitingOn === 'client'
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100'
                : 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30 hover:bg-sky-100'
            }`}
            title="Haz clic para alternar quién tiene la pelota"
          >
            <Clock className="w-3 h-3" />
            <span>{p.waitingOn === 'client' ? 'Esperando Cliente ⚠️' : 'Esperando Agencia'}</span>
          </button>

          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${role.bg}`}>
            {role.label}
          </span>
        </div>

        {/* Links & Quick Actions */}
        <div className="flex items-center justify-between text-xs pt-1">
          {p.driveUrl ? (
            <a
              href={p.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Drive Proyecto</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-500">Sin carpeta Drive</span>
          )}

          {p.targetDeliveryDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{p.targetDeliveryDate}</span>
            </div>
          )}
        </div>

        {/* Quick status selector */}
        <div className="pt-1">
          <select
            value={p.status}
            onChange={(e) => handleStatusChange(p, e.target.value)}
            className="w-full text-[11px] py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="pending">⏳ Estado: Pendiente</option>
            <option value="in_progress">⚙️ Estado: En Progreso</option>
            <option value="completed">✅ Estado: Completado</option>
            <option value="cancelled">🛑 Estado: Cancelado</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pipeline Total</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              ₲ {totalPipeline.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">{projects.length} proyectos registrados</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Anticipos Recibidos</p>
            <h3 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ₲ {totalAdvance.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Caja cobrada por la agencia</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saldo por Cobrar</p>
            <h3 className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              ₲ {pendingCollection.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Contra entrega de proyectos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bloqueados en Cliente</p>
            <h3 className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {waitingOnClientCount} {waitingOnClientCount === 1 ? 'proyecto' : 'proyectos'}
            </h3>
            <p className="text-[11px] text-amber-500/90 font-medium mt-1">Requieren seguimiento Ana/Martín</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Categoría:</span>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="all">Todas las categorías</option>
            <option value="web_corp">Web Corporativa</option>
            <option value="web_pymes">Mi Primera Web MiPyME</option>
            <option value="security">Hardening & Ciberseguridad</option>
            <option value="mobile_app">App Móvil / Sistema</option>
            <option value="cloud">Cloud & M365</option>
            <option value="automation">Automatización IA</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-2">
            <span className="font-semibold">Pelota en:</span>
          </div>
          <select
            value={filterWaitingOn}
            onChange={(e) => setFilterWaitingOn(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="all">Todos</option>
            <option value="client">Cliente ⚠️</option>
            <option value="agency">Agencia</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedClientForSnippets(null);
              setIsTeamSnippetsOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Equipo Virtual & Copys</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {/* Col 1: Pendiente - Bloqueado Cliente */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/20 dark:bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Pendiente (Cliente)
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
              {pendingClientProjects.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Esperando accesos, contenidos o aprobación de presupuesto.
          </p>

          <div className="space-y-3">
            {pendingClientProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Sin proyectos esperando cliente
              </div>
            ) : (
              pendingClientProjects.map(renderProjectCard)
            )}
          </div>
        </div>

        {/* Col 2: Pendiente - Espera Agencia */}
        <div className="rounded-2xl border border-sky-200 dark:border-sky-500/20 bg-sky-50/20 dark:bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200/60 dark:border-sky-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-sky-800 dark:text-sky-400">
                Pendiente (Agencia)
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300">
              {pendingAgencyProjects.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            En cola para asignación de diseño o planificación técnica.
          </p>

          <div className="space-y-3">
            {pendingAgencyProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Sin proyectos pendientes en cola
              </div>
            ) : (
              pendingAgencyProjects.map(renderProjectCard)
            )}
          </div>
        </div>

        {/* Col 3: En Progreso */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/20 dark:bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-400">
                En Progreso
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
              {inProgressProjects.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Anticipo cobrado y en ejecución activa de desarrollo o auditoría.
          </p>

          <div className="space-y-3">
            {inProgressProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Sin proyectos en ejecución
              </div>
            ) : (
              inProgressProjects.map(renderProjectCard)
            )}
          </div>
        </div>

        {/* Col 4: Completados */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Completados
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              {completedProjects.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Proyectos entregados, cobrados y en soporte o garantía.
          </p>

          <div className="space-y-3">
            {completedProjects.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Sin proyectos completados recientemente
              </div>
            ) : (
              completedProjects.map(renderProjectCard)
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto en Pipeline'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Client & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cliente Asociado
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Categoría de Portafolio
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="web_corp">Web Corporativa WordPress (₲2.5M - ₲6M)</option>
                    <option value="web_pymes">Mi Primera Web MiPyME (₲610k/año)</option>
                    <option value="security">Hardening & Ciberseguridad (₲1.8M)</option>
                    <option value="mobile_app">App Móvil / Sistema a Medida</option>
                    <option value="cloud">Cloud & Microsoft 365 (₲2.5M)</option>
                    <option value="automation">Automatización IA (₲1.8M)</option>
                    <option value="consulting">Consultoría TI (₲144k/h)</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Sitio Web Corporativo Repar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Budget & Advance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Presupuesto Total (PYG)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Anticipo Cobrado (PYG)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Status & Waiting On */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Estado en Pipeline
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="pending">⏳ Pendiente</option>
                    <option value="in_progress">⚙️ En Progreso</option>
                    <option value="completed">✅ Completado</option>
                    <option value="cancelled">🛑 Cancelado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ¿De quién depende el avance?
                  </label>
                  <select
                    value={waitingOn}
                    onChange={(e) => setWaitingOn(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="agency">Agencia (En desarrollo / diseño)</option>
                    <option value="client">Cliente ⚠️ (Esperando accesos / aprobación)</option>
                  </select>
                </div>
              </div>

              {/* Responsible Role & Target Delivery Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Responsable Asignado
                  </label>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="martin">Martín Gómez (Líder Técnico & Desarrollo)</option>
                    <option value="ana">Ana Rodríguez (Comercial & Cobranzas)</option>
                    <option value="diana">Diana Martínez (Administración & Finanzas)</option>
                    <option value="carla">Carla Fernández (Contenidos & Redes)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fecha Objetivo de Entrega
                  </label>
                  <input
                    type="date"
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Google Drive Folder Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Enlace Carpeta Google Drive
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notas / Requerimientos
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre alcance, estado actual o acuerdos clave con el cliente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Team Snippets Modal */}
      <TeamSnippetsModal
        isOpen={isTeamSnippetsOpen}
        onClose={() => setIsTeamSnippetsOpen(false)}
        selectedClient={selectedClientForSnippets}
      />
    </div>
  );
}
