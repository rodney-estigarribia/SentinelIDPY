'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import type { Client, ServiceGroup, Site } from '@/db/schema';
import { Badge } from '@/components/ui';

interface GroupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  clients?: Client[];
  sites: Site[];
  onGroupUpdated?: () => void;
}

export function GroupManagerModal({
  isOpen,
  onClose,
  client,
  clients,
  sites,
  onGroupUpdated,
}: GroupManagerModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<number>(
    client?.id || (clients && clients.length > 0 ? clients[0].id : 0)
  );
  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Group Form
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Group State
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete Confirm State
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    } else if (clients && clients.length > 0) {
      if (!selectedClientId || !clients.some((c) => c.id === selectedClientId)) {
        setSelectedClientId(clients[0].id);
      }
    }
  }, [client, clients, isOpen]);

  const activeClient =
    (clients && clients.find((c) => c.id === selectedClientId)) || client || null;

  const fetchGroups = async () => {
    if (!activeClient) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/service-groups?clientId=${activeClient.id}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Error fetching service groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeClient?.id) {
      fetchGroups();
      setIsCreating(false);
      setEditingGroupId(null);
      setDeletingGroupId(null);
    }
  }, [isOpen, activeClient?.id]);

  if (!isOpen) return null;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);

    try {
      if (!activeClient) return;
      const res = await fetch('/api/service-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: activeClient.id,
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setGroups((prev) => [...prev, created]);
        setNewName('');
        setNewDescription('');
        setIsCreating(false);
        if (onGroupUpdated) onGroupUpdated();
      } else {
        const err = await res.json();
        alert(`Error al crear agrupación: ${err.error || 'Desconocido'}`);
      }
    } catch (err: unknown) {
      alert(`Error de red: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (group: ServiceGroup) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditDescription(group.description || '');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/service-groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
        setEditingGroupId(null);
        if (onGroupUpdated) onGroupUpdated();
      } else {
        const err = await res.json();
        alert(`Error al actualizar: ${err.error || 'Desconocido'}`);
      }
    } catch (err: unknown) {
      alert(`Error de red: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/service-groups/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id));
        setDeletingGroupId(null);
        if (onGroupUpdated) onGroupUpdated();
      } else {
        const err = await res.json();
        alert(`Error al eliminar: ${err.error || 'Desconocido'}`);
      }
    } catch (err: unknown) {
      alert(`Error de red: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                Agrupaciones y Sistemas: {activeClient?.name || 'Cliente'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organiza los activos de este cliente en proyectos y módulos lógicos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client Selector (if opened from generic view with multiple clients) */}
        {clients && clients.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Cliente seleccionado:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Sistemas Registrados ({groups.length})
            </span>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Agrupación</span>
              </button>
            )}
          </div>

          {/* New Group Inline Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateGroup}
              className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-800 dark:text-indigo-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Crear Nueva Agrupación para {activeClient?.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
                  Nombre del Sistema / Agrupación
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Plataforma Móvil & Web, Landing Pages, Sistemas Empresariales"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-medium mb-1">
                  Descripción del Alcance (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Ecosistema conectado al backend en Render y frontend en cPanel"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Agrupación'}
                </button>
              </div>
            </form>
          )}

          {/* List Cards */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Cargando agrupaciones...</div>
          ) : groups.length === 0 && !isCreating ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No hay agrupaciones específicas registradas para este cliente. Todos sus activos aparecen bajo &quot;General&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((grp) => {
                const assignedCount = sites.filter(
                  (s) => s.clientId === activeClient?.id && s.serviceGroup === grp.name
                ).length;
                const isEditing = editingGroupId === grp.id;
                const isDeleting = deletingGroupId === grp.id;

                if (isEditing) {
                  return (
                    <div
                      key={grp.id}
                      className="p-3.5 rounded-xl border border-sky-500/40 bg-slate-50 dark:bg-slate-950 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Editando agrupación</span>
                        <button
                          onClick={() => setEditingGroupId(null)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre de la agrupación"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descripción opcional"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingGroupId(null)}
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(grp.id)}
                          disabled={isSubmitting}
                          className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={grp.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/70 flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm tracking-wide">
                          {grp.name}
                        </span>
                        <Badge variant="indigo" size="xs">
                          {assignedCount} {assignedCount === 1 ? 'activo' : 'activos'}
                        </Badge>
                      </div>
                      {grp.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {grp.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(grp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar agrupación"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
                          <button
                            onClick={() => handleDelete(grp.id)}
                            disabled={isSubmitting}
                            className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeletingGroupId(null)}
                            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingGroupId(grp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Eliminar agrupación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Los cambios se sincronizan en tiempo real con la ficha y el catálogo.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
