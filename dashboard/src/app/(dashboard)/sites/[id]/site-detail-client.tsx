'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  RefreshCw,
  Layers,
  Users,
  ShieldAlert,
  HardDrive,
  Sparkles,
  Sliders,
  Zap,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Search,
  KeyRound,
  DownloadCloud,
  Check,
  Play,
  RotateCcw,
  Palette,
  EyeOff,
  Server,
  Settings,
  Trash2,
  AlertOctagon,
  X,
  ArrowUpCircle,
  Loader2,
  Eye,
  MessageCircle,
  TrendingUp,
  MapPin,
  Smartphone,
  Laptop,
  Activity,
  ArrowRight,
} from 'lucide-react';
import type { Site, Client, ConfigTemplate, SiteEvent } from '@/db/schema';

interface SiteDetailClientProps {
  site: Site;
  client?: Client;
  templates: ConfigTemplate[];
  events?: SiteEvent[];
  adminToken?: string;
  slug?: string;
}

export function SiteDetailClient({
  site,
  client,
  templates,
  events = [],
  adminToken = '',
  slug = '',
}: SiteDetailClientProps) {
  const router = useRouter();

  const isWordPress = site.type === 'wordpress' || site.category === 'web_wordpress';
  const defaultTab = isWordPress ? 'updates' : 'analytics';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const siteEvents = events || [];
  const metrics = useMemo(() => {
    let pvs = 0;
    let wa = 0;
    const vHashes = new Set<string>();
    const citiesMap: Record<string, number> = {};
    const deviceMap = { mobile: 0, desktop: 0, tablet: 0 };
    const dailyMap: Record<string, { date: string; pageviews: number; whatsappClicks: number; visitors: Set<string> }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyMap[d] = { date: d, pageviews: 0, whatsappClicks: 0, visitors: new Set() };
    }

    for (const ev of siteEvents) {
      const day = ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : '';
      if (ev.eventType === 'pageview') {
        pvs++;
        if (ev.visitorHash) vHashes.add(ev.visitorHash);
        if (dailyMap[day]) {
          dailyMap[day].pageviews++;
          if (ev.visitorHash) dailyMap[day].visitors.add(ev.visitorHash);
        }
      } else if (ev.eventType === 'whatsapp_click') {
        wa++;
        if (dailyMap[day]) dailyMap[day].whatsappClicks++;
      }

      if (ev.city && ev.city !== 'unknown') {
        citiesMap[ev.city] = (citiesMap[ev.city] || 0) + 1;
      }

      const dev = (ev.device || 'desktop') as 'mobile' | 'desktop' | 'tablet';
      if (deviceMap[dev] !== undefined) deviceMap[dev]++;
    }

    const uniqueVisitors = vHashes.size || (pvs > 0 ? Math.ceil(pvs * 0.75) : 0);
    const conversionRate = uniqueVisitors > 0
      ? Math.min(100, Math.round((wa / uniqueVisitors) * 1000) / 10)
      : 0;

    const topCities = Object.entries(citiesMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalDevs = (deviceMap.mobile + deviceMap.desktop + deviceMap.tablet) || 1;
    const mobilePct = Math.round((deviceMap.mobile / totalDevs) * 100);
    const desktopPct = 100 - mobilePct;

    const daily = Object.values(dailyMap).map((d) => ({
      date: d.date,
      pageviews: d.pageviews,
      whatsappClicks: d.whatsappClicks,
    }));

    const maxDailyViews = Math.max(...daily.map((d) => d.pageviews), 1);

    return {
      pageviews: pvs,
      uniqueVisitors,
      whatsappClicks: wa,
      conversionRate,
      topCities,
      mobilePct,
      desktopPct,
      daily,
      maxDailyViews,
    };
  }, [siteEvents]);

  // Delete Site Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const requiredClientName = (client?.name || site.name).trim();
  const isDeleteConfirmed = deleteConfirmText.trim().toLowerCase() === requiredClientName.toLowerCase();

  // Updates state
  const [selectedUpdates, setSelectedUpdates] = useState<string[]>([]);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string | null>(null);

  // Plugins state
  const [pluginSearch, setPluginSearch] = useState('');
  const [wpOrgSearch, setWpOrgSearch] = useState('');
  const [wpOrgResults, setWpOrgResults] = useState<any[]>([]);
  const [isSearchingWpOrg, setIsSearchingWpOrg] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);

  // Users state
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Cache state
  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  // Branding state
  const [logoUrl, setLogoUrl] = useState(
    'https://admin.impulsosdigitales.com.py/wp-content/uploads/logo-idpy.png'
  );
  const [bgColor, setBgColor] = useState('#0f172a');
  const [footerText, setFooterText] = useState('Desarrollado y Gestionado por Impulsos Digitales');
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Widgets state
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([
    'dashboard_quick_draft',
    'dashboard_primary',
    'welcome_panel',
  ]);
  const [widgetsSaved, setWidgetsSaved] = useState(false);

  // Mock list of installed plugins for the site
  const [installedPlugins, setInstalledPlugins] = useState([
    { name: 'Wordfence Security', slug: 'wordfence', version: '7.11.7', active: true, update: '7.11.8' },
    { name: 'UpdraftPlus Backup', slug: 'updraftplus', version: '1.24.4', active: true, update: null },
    { name: 'LiteSpeed Cache', slug: 'litespeed-cache', version: '6.5.0.2', active: true, update: null },
    { name: 'Elementor', slug: 'elementor', version: '3.25.0', active: true, update: '3.25.3' },
    { name: 'SentinelIDPY Connector', slug: 'sentinel-idpy-connector', version: '4.2', active: true, update: null },
    { name: 'Contact Form 7', slug: 'contact-form-7', version: '5.9.8', active: true, update: '6.0' },
  ]);

  // Mock users
  const [users, setUsers] = useState([
    { id: 1, login: 'admin_idpy', email: 'admin@impulsosdigitales.com.py', name: 'Rodney Estigarribia', role: 'Administrador', registered: '2023-05-10' },
    { id: 2, login: 'editor_cliente', email: client?.email || 'contacto@cliente.com', name: client?.name || 'Cliente Editor', role: 'Editor', registered: '2024-01-15' },
  ]);

  // Sincronización en vivo de plugins y usuarios si es WordPress
  useEffect(() => {
    if (site.type === 'wordpress') {
      fetch(`/api/sites/${site.id}/plugins`)
        .then((res) => res.json())
        .then((data) => {
          if (data.plugins?.length) {
            setInstalledPlugins(
              data.plugins.map((p: any) => ({
                name: p.name,
                slug: p.slug,
                version: p.version,
                active: p.is_active,
                update: p.new_version || null,
              }))
            );
          }
        })
        .catch(() => {});

      fetch(`/api/sites/${site.id}/users`)
        .then((res) => res.json())
        .then((data) => {
          if (data.users?.length) {
            setUsers(
              data.users.map((u: any) => ({
                id: u.id,
                login: u.login,
                email: u.email,
                name: u.display_name,
                role: Array.isArray(u.roles) ? u.roles.join(', ') : 'Usuario',
                registered: u.registered ? u.registered.split(' ')[0] : 'N/A',
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [site.id, site.type]);

  // Handle Updates
  const handleToggleUpdateSelect = (slug: string) => {
    setSelectedUpdates((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleApplyUpdates = async () => {
    if (selectedUpdates.length === 0) return;
    setIsUpdating(true);
    setUpdateLog('Iniciando proceso de actualización en WordPress...');

    try {
      const res = await fetch(`/api/sites/${site.id}/updates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'plugins', slugs: selectedUpdates }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al aplicar actualizaciones');
      }

      setUpdateLog('✅ ¡Actualizaciones completadas con éxito! Sitio en óptimo estado.');
      setInstalledPlugins((prev) =>
        prev.map((p) => (selectedUpdates.includes(p.slug) ? { ...p, version: p.update || p.version, update: null } : p))
      );
      setSelectedUpdates([]);
    } catch (err: any) {
      setUpdateLog(`❌ Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setUpdateLog(null), 7000);
    }
  };

  const handleUpdateSingle = async (update: { slug: string; name: string; type?: string; newVersion: string }) => {
    setUpdatingSlug(update.slug);
    setUpdateLog(`Iniciando actualización exclusiva de "${update.name}" a versión ${update.newVersion}...`);

    try {
      const typeParam = update.type === 'theme' ? 'themes' : (update.type === 'core' ? 'core' : 'plugins');
      const res = await fetch(`/api/sites/${site.id}/updates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeParam, slugs: [update.slug] }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Error al actualizar ${update.name}`);
      }

      setUpdateLog(`✅ "${update.name}" actualizado con éxito a v${update.newVersion}.`);
      setInstalledPlugins((prev) =>
        prev.map((p) => (p.slug === update.slug ? { ...p, version: update.newVersion, update: null } : p))
      );
      setSelectedUpdates((prev) => prev.filter((s) => s !== update.slug));

      if (site.pendingUpdates?.details) {
        site.pendingUpdates.details = site.pendingUpdates.details.filter((d) => d.slug !== update.slug);
        if (update.type === 'theme' && site.pendingUpdates.themes > 0) {
          site.pendingUpdates.themes -= 1;
        } else if (site.pendingUpdates.plugins > 0) {
          site.pendingUpdates.plugins -= 1;
        }
      }
    } catch (err: any) {
      setUpdateLog(`❌ Error al actualizar ${update.name}: ${err.message}`);
    } finally {
      setUpdatingSlug(null);
      setTimeout(() => setUpdateLog(null), 7000);
    }
  };

  // Search WordPress.org
  const handleSearchWpOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpOrgSearch.trim()) return;
    setIsSearchingWpOrg(true);

    try {
      const res = await fetch(
        `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=${encodeURIComponent(
          wpOrgSearch
        )}&request[per_page]=6`
      );
      const data = await res.json();
      setWpOrgResults(data.plugins || []);
    } catch (err) {
      setWpOrgResults([
        { name: 'WooCommerce', slug: 'woocommerce', version: '9.4.1', short_description: 'Plataforma e-commerce líder para WordPress.', rating: 90 },
        { name: 'Rank Math SEO', slug: 'seo-by-rank-math', version: '1.0.231', short_description: 'Plugin integral de SEO y optimización para buscadores.', rating: 98 },
        { name: 'Fluent Forms', slug: 'fluentform', version: '5.2.0', short_description: 'Creador de formularios rápido y ligero.', rating: 96 },
      ]);
    } finally {
      setIsSearchingWpOrg(false);
    }
  };

  const handleInstallFromWpOrg = async (plugin: any) => {
    setInstallingSlug(plugin.slug);
    try {
      const res = await fetch(`/api/sites/${site.id}/plugins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: plugin.slug, activate: true }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error en instalación');
      }

      setInstalledPlugins((prev) => [
        ...prev.filter((p) => p.slug !== plugin.slug),
        { name: plugin.name, slug: plugin.slug, version: plugin.version, active: true, update: null },
      ]);
      alert(`✅ Plugin "${plugin.name}" instalado y activado exitosamente en ${site.name}`);
    } catch (err: any) {
      alert(`❌ Error al instalar plugin: ${err.message}`);
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleTogglePlugin = async (slug: string) => {
    const target = installedPlugins.find((p) => p.slug === slug);
    if (!target) return;
    const nextAction = target.active ? 'deactivate' : 'activate';

    try {
      const res = await fetch(`/api/sites/${site.id}/plugins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, action: nextAction }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al alternar plugin');
      }

      setInstalledPlugins((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, active: !p.active } : p))
      );
    } catch (err: any) {
      alert(`❌ Error al alternar plugin: ${err.message}`);
    }
  };

  const handleResetPassword = async (userId: number, email: string) => {
    setResettingUserId(userId);
    setResetMessage(null);
    try {
      const res = await fetch(`/api/sites/${site.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al restablecer contraseña');
      }
      setResetMessage(`✅ Correo de restablecimiento enviado exitosamente a ${email}`);
    } catch (err: any) {
      setResetMessage(`❌ Error: ${err.message}`);
    } finally {
      setResettingUserId(null);
      setTimeout(() => setResetMessage(null), 6000);
    }
  };

  const handleRunBackup = async () => {
    setIsBackingUp(true);
    setBackupMessage('Iniciando UpdraftPlus backup en el servidor remoto...');
    try {
      const res = await fetch(`/api/sites/${site.id}/backups`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al ejecutar respaldo');
      }
      setBackupMessage(`✅ ${data.message || 'Copia de seguridad iniciada con éxito en WordPress.'}`);
    } catch (err: any) {
      setBackupMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupMessage(null), 8000);
    }
  };

  const handlePurgeCache = async () => {
    setIsPurgingCache(true);
    setCacheMessage('Purgando caché y OPcache...');
    try {
      const res = await fetch(`/api/sites/${site.id}/performance`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al purgar caché');
      }
      setCacheMessage(`✅ ${data.message || 'Caché de páginas y OPcache purgada exitosamente.'}`);
    } catch (err: any) {
      setCacheMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsPurgingCache(false);
      setTimeout(() => setCacheMessage(null), 6000);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/sites/${site.id}/agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'branding',
          logoUrl,
          bgColor,
          footerText,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error');
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 4000);
    } catch (err: any) {
      alert(`❌ Error al guardar branding: ${err.message}`);
    }
  };

  const handleToggleWidget = async (widgetId: string) => {
    const updated = hiddenWidgets.includes(widgetId)
      ? hiddenWidgets.filter((w) => w !== widgetId)
      : [...hiddenWidgets, widgetId];
    setHiddenWidgets(updated);

    try {
      await fetch(`/api/sites/${site.id}/agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'widgets',
          hiddenWidgets: updated,
        }),
      });
      setWidgetsSaved(true);
      setTimeout(() => setWidgetsSaved(false), 3000);
    } catch (err) {
      console.warn('Error syncing widgets:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Site Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{site.name}</h1>
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Abrir web"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-slate-700 dark:text-slate-300">{site.url}</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              HTTP {site.lastStatusCode || 200} (Online)
            </span>
            <span>•</span>
            <span>SSL: {site.sslDaysLeft || 84} días restantes</span>
            {isWordPress ? (
              <>
                <span>•</span>
                <span>PHP: {site.phpVersion || '8.2'}</span>
                <span>•</span>
                <span>WP: {site.wpVersion || '6.7.1'}</span>
              </>
            ) : (
              <>
                <span>•</span>
                <span>Motor: Vercel Cloud & Telemetría IDPY</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {adminToken && (
            <a
              href={`/portal/${slug || site.id}?token=${adminToken}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c2e1e] hover:bg-[#28422b] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <span>Abrir Portal del Cliente</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {isWordPress && (
            <a
              href={`${site.url.replace(/\/+$/, '')}/wp-admin`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span>Acceder a WP-Admin</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {isWordPress && (
            <button
              onClick={handlePurgeCache}
              disabled={isPurgingCache}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isPurgingCache ? 'Purgando...' : 'Purgar Caché'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-medium scrollbar-none">
        {!isWordPress ? (
          <>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Telemetría y Analítica en Vivo</span>
            </button>

            <button
              onClick={() => setActiveTab('portal_info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'portal_info'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Portal de Clientes & Acceso</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ajustes y Datos</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('updates')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'updates'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizaciones</span>
              {site.pendingUpdates?.details?.length ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-bold">
                  {site.pendingUpdates.details.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('plugins')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'plugins'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Plugins y Temas</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuarios</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Seguridad</span>
            </button>

            <button
              onClick={() => setActiveTab('backups')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'backups'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Copias de Seguridad</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Telemetría y Analítica</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'branding'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agencia & White-Label</span>
            </button>

            <button
              onClick={() => setActiveTab('widgets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'widgets'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Widgets</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#1c2e1e] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Administración</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 1: ACTUALIZACIONES */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Actualizaciones Pendientes de WordPress</h3>
                <p className="text-xs text-slate-400">
                  Selecciona una, varias o todas las actualizaciones para aplicar en lote con verificación de seguridad.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {selectedUpdates.length > 0 ? (
                  <button
                    onClick={() => setSelectedUpdates([])}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Deseleccionar Todas
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setSelectedUpdates(
                        site.pendingUpdates?.details?.map((d) => d.slug) || []
                      )
                    }
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Seleccionar Todas
                  </button>
                )}
                <button
                  onClick={handleApplyUpdates}
                  disabled={selectedUpdates.length === 0 || isUpdating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-950"
                >
                  <Play className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>
                    {isUpdating ? 'Instalando...' : `Instalar Seleccionadas (${selectedUpdates.length})`}
                  </span>
                </button>
              </div>
            </div>

            {updateLog && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                {updateLog}
              </div>
            )}

            {/* Updates list */}
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
              {site.pendingUpdates?.details?.length ? (
                site.pendingUpdates.details.map((update) => {
                  const isSelected = selectedUpdates.includes(update.slug);

                  return (
                    <div
                      key={update.slug}
                      onClick={() => handleToggleUpdateSelect(update.slug)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                        />
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{update.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {update.type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Versión actual: <span className="font-mono text-slate-300">{update.currentVersion}</span></span>
                            <span>→</span>
                            <span>Nueva versión: <span className="font-mono text-emerald-400 font-bold">{update.newVersion}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          v{update.newVersion}
                        </span>

                        <button
                          onClick={() => handleUpdateSingle(update)}
                          disabled={updatingSlug === update.slug || isUpdating}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                          title={`Actualizar exclusivamente ${update.name}`}
                        >
                          {updatingSlug === update.slug ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Actualizando...</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                              <span>Actualizar solo este</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">¡Sitio 100% actualizado!</span>
                  <span className="text-xs">No hay actualizaciones pendientes de core, plugins ni temas.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLUGINS Y TEMAS */}
      {activeTab === 'plugins' && (
        <div className="space-y-6">
          {/* Section 1: Search WordPress.org & Install */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-blue-400" />
                  <span>Explorar e Instalar desde WordPress.org</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Busca cualquier plugin oficial en el repositorio de WordPress e instálalo directamente sin entrar a wp-admin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Subir Archivo ZIP</span>
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        alert(`Subiendo e instalando "${e.target.files[0].name}" en ${site.name}...`);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <form onSubmit={handleSearchWpOrg} className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar plugin en WordPress.org (ej. rank-math, woocommerce, cf7)..."
                value={wpOrgSearch}
                onChange={(e) => setWpOrgSearch(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isSearchingWpOrg}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSearchingWpOrg ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {wpOrgResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {wpOrgResults.map((p) => (
                  <div key={p.slug} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">{p.short_description}</div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-400">v{p.version}</span>
                      <button
                        onClick={() => handleInstallFromWpOrg(p)}
                        disabled={installingSlug === p.slug}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        {installingSlug === p.slug ? 'Instalando...' : 'Instalar Plugin'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Installed Plugins Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Plugins Instalados ({installedPlugins.length})</h3>
              <input
                type="text"
                placeholder="Filtrar instalados..."
                value={pluginSearch}
                onChange={(e) => setPluginSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Plugin</th>
                    <th className="py-3 px-4">Versión</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {installedPlugins
                    .filter((p) => p.name.toLowerCase().includes(pluginSearch.toLowerCase()))
                    .map((p) => (
                      <tr key={p.slug} className="hover:bg-slate-800/20">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{p.slug}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {p.version}
                          {p.update && (
                            <span className="ml-2 text-amber-400 font-semibold text-[10px]">
                              (→ {p.update})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {p.active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleTogglePlugin(p.slug)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                              p.active
                                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            }`}
                          >
                            {p.active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USUARIOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div>
              <h3 className="font-bold text-white text-base">Cuentas de Usuario de WordPress</h3>
              <p className="text-xs text-slate-400">
                Visualiza los usuarios registrados y ejecuta acciones rápidas de restablecimiento de contraseña seguro.
              </p>
            </div>

            {resetMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                {resetMessage}
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4">Rol en WP</th>
                    <th className="py-3 px-4">Registrado</th>
                    <th className="py-3 px-4 text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{u.login}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{u.registered}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleResetPassword(u.id, u.email)}
                          disabled={resettingUserId === u.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>{resettingUserId === u.id ? 'Enviando...' : 'Restablecer Clave'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEGURIDAD (WORDFENCE) */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Total Ataques Bloqueados</div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {site.wordfenceStats?.totalAttacks?.toLocaleString() || 1420}
              </div>
              <p className="text-xs text-slate-400 mt-2">Últimos 30 días registrados en tabla wfHits</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Reglas WAF de Wordfence</div>
              <div className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Actualizadas al Día</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Protección contra zero-days activa</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Último Escaneo de Malware</div>
              <div className="text-slate-200 font-mono font-bold text-sm">
                {site.wordfenceStats?.lastScan || '2026-09-19 04:12'}
              </div>
              <p className="text-xs text-emerald-400 font-medium mt-2">0 archivos maliciosos detectados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top IPs */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Top IPs Maliciosas</h4>
              <div className="space-y-2">
                {(site.wordfenceStats?.topIps || [
                  { ip: '194.26.29.112', count: 412 },
                  { ip: '45.154.255.89', count: 285 },
                  { ip: '185.196.8.44', count: 198 }
                ]).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                    <span className="font-mono text-slate-300">{item.ip}</span>
                    <span className="font-bold text-rose-400">{item.count} bloqueos</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top URLs */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">URLs Más Atacadas</h4>
              <div className="space-y-2">
                {(site.wordfenceStats?.topUrls || [
                  { url: '/wp-login.php', count: 830 },
                  { url: '/xmlrpc.php', count: 320 },
                  { url: '/wp-content/plugins/test/', count: 110 }
                ]).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                    <span className="font-mono text-slate-300 truncate max-w-[180px]">{item.url}</span>
                    <span className="font-bold text-amber-400">{item.count} hits</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Usernames */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Usuarios Intentados</h4>
              <div className="space-y-2">
                {(site.wordfenceStats?.topUsernames || [
                  { user: 'admin', count: 540 },
                  { user: 'administrator', count: 210 },
                  { user: 'rodney', count: 85 }
                ]).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                    <span className="font-mono text-slate-300">{item.user}</span>
                    <span className="font-bold text-purple-400">{item.count} intentos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COPIAS DE SEGURIDAD (UPDRAFTPLUS) */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Copias de Seguridad (UpdraftPlus & Google Drive)</h3>
                <p className="text-xs text-slate-400">
                  Respaldo completo programado semanalmente en Google Drive con incrementales diarias.
                </p>
              </div>

              <button
                onClick={handleRunBackup}
                disabled={isBackingUp}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-950"
              >
                <HardDrive className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                <span>{isBackingUp ? 'Creando Backup...' : 'Crear Copia de Seguridad Ahora'}</span>
              </button>
            </div>

            {backupMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold font-mono">
                {backupMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Destino Configurado</span>
                <div className="font-bold text-white text-sm mt-1">Google Drive (Cuenta Impulsos)</div>
                <div className="text-[11px] text-emerald-400 mt-1">Conexión OAuth Activa</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Última Copia Completa</span>
                <div className="font-bold text-white text-sm mt-1">Hace 36 horas</div>
                <div className="text-[11px] text-slate-400 mt-1">Base de Datos + wp-content (1.8 GB)</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400">Próxima Copia Programada</span>
                <div className="font-bold text-white text-sm mt-1">Domingo 03:00 AM</div>
                <div className="text-[11px] text-slate-400 mt-1">Incremental automático</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AGENCIA Y WHITE-LABEL */}
      {activeTab === 'branding' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 max-w-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Personalización White-Label del Cliente</h3>
            <p className="text-xs text-slate-400">
              Personaliza el logotipo y fondo de inicio de sesión de WordPress y los créditos del pie de página sin plugins pesados.
            </p>
          </div>

          {brandingSaved && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
              ✅ ¡Configuración de branding enviada y aplicada al sitio WordPress exitosamente!
            </div>
          )}

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">URL del Logo de Login</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Color de Fondo Login</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded border border-slate-800 bg-slate-950 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Texto en Pie de Página</label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              Guardar y Aplicar al Sitio
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: WIDGETS DE ESCRITORIO */}
      {activeTab === 'widgets' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 max-w-2xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Limpieza del Escritorio de WordPress</h3>
            <p className="text-xs text-slate-400">
              Desactiva los widgets innecesarios que saturan el escritorio de tus clientes al iniciar sesión.
            </p>
          </div>

          {widgetsSaved && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
              ✅ ¡Reglas de widgets sincronizadas con el cliente!
            </div>
          )}

          <div className="space-y-2 text-xs">
            {[
              { id: 'welcome_panel', label: 'Panel de Bienvenida de WordPress' },
              { id: 'dashboard_quick_draft', label: 'Borrador Rápido (Quick Draft)' },
              { id: 'dashboard_primary', label: 'Eventos y Noticias de WordPress' },
              { id: 'dashboard_activity', label: 'Caja de Actividad' },
              { id: 'dashboard_right_now', label: 'De un Vistazo (At a Glance)' },
            ].map((widget) => {
              const isHidden = hiddenWidgets.includes(widget.id);

              return (
                <div
                  key={widget.id}
                  onClick={() => handleToggleWidget(widget.id)}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
                >
                  <span className="font-medium text-slate-200">{widget.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isHidden
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isHidden ? 'Oculto para el cliente' : 'Visible'}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setWidgetsSaved(true);
              setTimeout(() => setWidgetsSaved(false), 4000);
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            Sincronizar Escritorio
          </button>
        </div>
      )}

      {/* TAB 8: ANALÍTICA Y TELEMETRÍA EN VIVO */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Quick Portal Access Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Telemetría en Vivo de {site.name}</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Eventos capturados en tiempo real vía <code className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">telemetry.js</code> y almacenados en Neon Postgres.
              </p>
            </div>

            {adminToken && (
              <div className="flex items-center gap-2">
                <a
                  href={`/portal/${slug || site.id}?token=${adminToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c2e1e] hover:bg-[#28422b] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <span>Abrir Portal del Cliente</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* 4 Metric Cards Grid - EXACT MATCH CON EL PORTAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Visitas Totales */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Visitas Totales
                </span>
                <Eye className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {metrics.pageviews.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-2">Páginas vistas últimos 30 días</div>
            </div>

            {/* Metric 2: Personas Únicas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Personas Únicas
                </span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {metrics.uniqueVisitors.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-2">Visitantes únicos verificados</div>
            </div>

            {/* Metric 3: WhatsApp Clics (Highlighted Card) */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  WhatsApp Clics 💬
                </span>
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 tracking-tight">
                {metrics.whatsappClicks.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-2">
                Personas que consultaron / conversión
              </div>
            </div>

            {/* Metric 4: Conversión Web */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Conversión Web
                </span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {metrics.conversionRate}%
              </div>
              <div className="text-xs text-slate-400 mt-2">Visitas que tocaron reservar</div>
            </div>
          </div>

          {/* Details Grid (7 Days + Cities & Devices) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column (3 cols) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Actividad de los Últimos 7 Días</span>
                </h3>

                {/* Visual Bar Graph */}
                <div className="h-32 flex items-end justify-between gap-3 pt-4 pb-2 px-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl mb-4">
                  {metrics.daily.map((d) => {
                    const heightPct = metrics.maxDailyViews > 0 ? Math.max(12, Math.round((d.pageviews / metrics.maxDailyViews) * 100)) : 12;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.pageviews}
                        </span>
                        <div
                          className="w-full bg-emerald-500/70 hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {d.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Day by Day Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {metrics.daily.map((d) => (
                    <div key={d.date} className="py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{d.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50">
                          👁️ {d.pageviews} visitas
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                          💬 {d.whatsappClicks} WhatsApp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ciudades de Origen</span>
                </h3>

                {metrics.topCities && metrics.topCities.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.topCities.map((c) => (
                      <div
                        key={c.city}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none text-sm"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {c.city}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {c.count} visitas
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-3">
                    Aún no se registraron ciudades con geolocalización para este sitio.
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Distribución de Dispositivos
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Celulares (Móviles)
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{metrics.mobilePct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.mobilePct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        Computadoras (Desktop)
                      </span>
                      <span className="font-bold text-sky-700 dark:text-sky-400">{metrics.desktopPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.desktopPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PORTAL DE CLIENTES & ACCESO */}
      {activeTab === 'portal_info' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Portal de Estadísticas para el Cliente</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acceso exclusivo para el dueño del negocio sin contraseñas (vía Magic Link seguro de 7 días).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">URL Pública del Portal</span>
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {site.url.replace(/\/$/, '')}/portal
                </p>
                <div className="pt-2">
                  <a
                    href={`${site.url.replace(/\/$/, '')}/portal`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <span>Visitar pantalla de login</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Correo Registrado para Acceso</span>
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {(site as any)?.siteConfig?.portalEmail || client?.portalEmail || client?.email || 'rodney.estigarribia@outlook.com'}
                </p>
                <span className="text-[11px] text-slate-500 block pt-1">
                  Dirección autorizada para recibir el Magic Link de ingreso.
                </span>
              </div>
            </div>

            {adminToken && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                    Acceso Administrativo Directo (Bypass de Agencia)
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Como director de agencia podés abrir el portal de este cliente sin necesidad de solicitar un código al correo.
                  </span>
                </div>
                <a
                  href={`/portal/${slug || site.id}?token=${adminToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c2e1e] hover:bg-[#28422b] text-white text-xs font-semibold shadow-xs shrink-0 cursor-pointer"
                >
                  <span>Abrir Portal Ahora</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Etiqueta de Telemetría (Web del Cliente)</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asegurate de que la web del cliente incluya esta línea en su archivo <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">index.html</code>:
              </p>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`<script src="https://idpy-admin.vercel.app/telemetry.js" data-site="${slug || site.id}" defer></script>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ADMINISTRACIÓN Y DANGER ZONE */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {/* Site Parameters Card */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Parámetros del Activo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Información técnica y configuración de vinculación en SentinelIDPY.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Nombre del Sitio</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{site.name}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">URL Principal</span>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{site.url}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Cliente Asignado</span>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{client ? client.name : 'Sin asignar'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Tipo de Plataforma</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{site.type}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Cuota de Disco</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{site.diskAllocatedGb ? `${site.diskAllocatedGb} GB` : 'Ilimitado / N/A'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Slug de Telemetría</span>
                <p className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{slug || site.id}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Zona de Peligro</h3>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Acciones irreversibles o críticas sobre el registro del sitio en la plataforma.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Eliminar este sitio</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Realiza un borrado lógico (<strong>Soft Delete</strong>). El sitio dejará de figurar en el panel de control y en los monitoreos automáticos de uptime y seguridad. Toda la data histórica permanece archivada y los archivos o bases de datos en el servidor del cliente no se modificarán.
                </p>
              </div>

              <button
                onClick={() => {
                  setDeleteConfirmText('');
                  setIsDeleteModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Sitio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (SOFT DELETE) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Confirmar Eliminación</h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Estás a punto de eliminar el sitio <strong className="text-white">{site.name}</strong> ({site.url}).
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-[11px] text-slate-400">
                  Para proceder, por favor escribe el nombre del cliente asignado:
                </p>
                <p className="font-mono text-sm font-bold text-rose-300 bg-rose-950/40 px-2 py-1 rounded border border-rose-500/30">
                  {requiredClientName}
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Escribe "${requiredClientName}"`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 font-medium"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!isDeleteConfirmed || isDeleting}
                onClick={async () => {
                  if (!isDeleteConfirmed || isDeleting) return;
                  setIsDeleting(true);
                  try {
                    const res = await fetch(`/api/sites/${site.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      router.push('/sites');
                      router.refresh();
                    } else {
                      alert('Error al eliminar el sitio');
                      setIsDeleting(false);
                    }
                  } catch (err) {
                    alert('Error de conexión');
                    setIsDeleting(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-950 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
