'use client';

import React, { useState } from 'react';
import {
  Layers,
  Search,
  Upload,
  DownloadCloud,
  CheckCircle2,
  Globe,
  Play,
  Check,
  ExternalLink,
  Terminal,
  Copy,
  ClipboardCheck,
  RefreshCw,
  Trash2
} from 'lucide-react';
import type { Site } from '@/db/schema';

interface PluginsClientProps {
  sites: Site[];
}

export function PluginsClient({ sites }: PluginsClientProps) {
  const [wpOrgQuery, setWpOrgQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([
    {
      name: 'LiteSpeed Cache',
      slug: 'litespeed-cache',
      version: '6.5.0.2',
      author: 'LiteSpeed Technologies',
      short_description: 'Aceleración integral de páginas, minificación de código y optimización de imágenes.',
      active_installs: '5+ millones',
    },
    {
      name: 'Wordfence Security',
      slug: 'wordfence',
      version: '7.11.8',
      author: 'Wordfence',
      short_description: 'Firewall de aplicaciones web, escaneo de malware y protección contra fuerza bruta.',
      active_installs: '5+ millones',
    },
    {
      name: 'UpdraftPlus Backup',
      slug: 'updraftplus',
      version: '1.24.6',
      author: 'UpdraftPlus.Com Ltd',
      short_description: 'Copias de seguridad automáticas y restauración hacia Google Drive y la nube.',
      active_installs: '3+ millones',
    },
    {
      name: 'Rank Math SEO',
      slug: 'seo-by-rank-math',
      version: '1.0.231',
      author: 'Rank Math',
      short_description: 'Suite completa de SEO, marcado schema y optimización de contenidos.',
      active_installs: '2+ millones',
    },
  ]);

  const [selectedSites, setSelectedSites] = useState<number[]>(sites.map((s) => s.id));
  const [selectedPlugin, setSelectedPlugin] = useState<any>(searchResults[0]);
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);

  // Execution & Live Console state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
    setDeployResult(null);
    setProgress(0);
    setCompletedCount(0);
    setCurrentStep(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpOrgQuery.trim()) return;
    setIsSearching(true);

    try {
      const res = await fetch(
        `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=${encodeURIComponent(
          wpOrgQuery
        )}&request[per_page]=6`
      );
      const data = await res.json();
      if (data.plugins?.length) {
        setSearchResults(data.plugins);
        setSelectedPlugin(data.plugins[0]);
        setSelectedZipFile(null);
      }
    } catch (err) {
      console.warn('WP.org search fallback:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeploy = async () => {
    if (selectedSites.length === 0 || !selectedPlugin) return;
    setIsDeploying(true);
    setProgress(5);
    setCompletedCount(0);
    setDeployResult(null);

    const total = selectedSites.length;
    let base64Content: string | undefined = undefined;

    setLogs((prev) => [
      `[SentinelIDPY] Iniciando despliegue de plugin: ${selectedPlugin.name}...`,
      `[SentinelIDPY] Total sitios seleccionados: ${total}`,
      ...prev,
    ]);

    if (selectedPlugin.isZip && selectedZipFile) {
      setCurrentStep(`Procesando archivo ZIP local (${selectedZipFile.name})...`);
      try {
        base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const raw = reader.result as string;
            const clean = raw.includes(',') ? raw.split(',')[1] : raw;
            resolve(clean);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedZipFile);
        });
        setLogs((prev) => [
          `[OK] Archivo ZIP leído y codificado (${Math.round(((base64Content?.length || 0) * 3) / 4 / 1024)} KB listo para envío).`,
          ...prev,
        ]);
      } catch (err: any) {
        setIsDeploying(false);
        setCurrentStep(null);
        setLogs((prev) => [
          `[ERROR] No se pudo leer el archivo ZIP local: ${err.message}`,
          ...prev,
        ]);
        return;
      }
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < total; i++) {
      const siteId = selectedSites[i];
      const site = sites.find((s) => s.id === siteId);
      const siteName = site?.name || `Sitio #${siteId}`;

      setCurrentStep(`Desplegando en ${siteName} (${i + 1}/${total})...`);

      try {
        const payload: any = {
          slug: selectedPlugin.slug,
          activate: true,
        };
        if (base64Content) {
          payload.zipBase64 = base64Content;
        }

        const res = await fetch(`/api/sites/${siteId}/plugins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Error en instalación en el sitio');
        }

        success++;
        setLogs((prev) => [
          `[OK] ${siteName}: Plugin "${selectedPlugin.name}" instalado y activado con éxito.`,
          ...prev,
        ]);
      } catch (err: any) {
        failed++;
        setLogs((prev) => [
          `[ERROR] ${siteName}: ${err.message}`,
          ...prev,
        ]);
      }

      setCompletedCount(i + 1);
      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsDeploying(false);
    setCurrentStep(null);

    if (failed === 0) {
      setDeployResult(
        `✅ Plugin "${selectedPlugin.name}" instalado y activado exitosamente en los ${success} sitios seleccionados.`
      );
    } else {
      setDeployResult(
        `⚠️ Despliegue con errores: ${success} exitosos, ${failed} fallidos. Revisa la consola abajo para diagnósticos.`
      );
    }
  };

  const handleToggleSite = (id: number) => {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Deployment Console */}
      {(isDeploying || logs.length > 0) && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Consola de Despliegue de Plugins en Vivo
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {completedCount} / {selectedSites.length} completados ({progress}%)
              </span>
              {logs.length > 0 && (
                <>
                  <button
                    onClick={handleCopyLogs}
                    title="Copiar logs al portapapeles"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  {!isDeploying && (
                    <button
                      onClick={handleClearLogs}
                      title="Limpiar consola"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition-colors border border-slate-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentStep && (
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span>{currentStep}</span>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-800 max-h-56 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[ERROR]')
                    ? 'text-rose-400'
                    : log.includes('[OK]')
                    ? 'text-emerald-400'
                    : log.includes('[ZIP]')
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Explorer & Uploader (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Search Bar */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Explorar Directorio Oficial WordPress.org</span>
              </h3>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Instalar desde ZIP</span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedZipFile(file);
                      setSelectedPlugin({
                        name: file.name.replace('.zip', ''),
                        slug: file.name.replace('.zip', '').toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                        version: 'Manual (ZIP)',
                        author: 'Archivo Local',
                        short_description: `Paquete ZIP local (${(file.size / 1024).toFixed(1)} KB): ${file.name}`,
                        isZip: true,
                      });
                      setLogs((prev) => [
                        `[ZIP] Paquete cargado: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Listo para desplegar en los sitios seleccionados.`,
                        ...prev,
                      ]);
                    }
                  }}
                />
              </label>
            </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar en millones de plugins (ej. elementor, redis, mail, contact)..."
              value={wpOrgQuery}
              onChange={(e) => setWpOrgQuery(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {/* Results Grid */}
          <div className="space-y-2.5 pt-2">
            {searchResults.map((plugin) => {
              const isSelected = selectedPlugin?.slug === plugin.slug;

              return (
                <div
                  key={plugin.slug}
                  onClick={() => setSelectedPlugin(plugin)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/10 dark:border-blue-500/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{plugin.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">v{plugin.version}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{plugin.short_description}</p>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                      Por <span className="text-slate-700 dark:text-slate-300 font-medium">{plugin.author}</span> • {plugin.active_installs || 'Oficial'}
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Multi-Site Target Selector & Deploy Action (5 cols) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Destinos de Instalación</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona en qué sitios se desplegará el plugin seleccionado.
            </p>
          </div>

          {selectedPlugin && (
            <div className="p-3.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 text-xs">
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">Plugin Seleccionado:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedPlugin.name}</span>
              <span className="block text-[11px] text-blue-600 dark:text-blue-300 font-mono mt-0.5 font-semibold">
                v{selectedPlugin.version}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            <span>{selectedSites.length} de {sites.length} sitios elegidos</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSites(sites.map((s) => s.id))}
                className="hover:text-blue-600 dark:hover:text-white font-semibold text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Todos
              </button>
              <span>•</span>
              <button
                onClick={() => setSelectedSites([])}
                className="hover:text-blue-600 dark:hover:text-white font-semibold text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Ninguno
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {sites.map((site) => {
              const isChecked = selectedSites.includes(site.id);

              return (
                <div
                  key={site.id}
                  onClick={() => handleToggleSite(site.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    isChecked
                      ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{site.name}</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {site.url.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-900 focus:ring-emerald-500"
                  />
                </div>
              );
            })}
          </div>

          {deployResult && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              {deployResult}
            </div>
          )}

          <button
            onClick={handleDeploy}
            disabled={selectedSites.length === 0 || !selectedPlugin || isDeploying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm hover:shadow cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isDeploying ? 'animate-spin' : ''}`} />
            <span>
              {isDeploying
                ? 'Desplegando e Instalando...'
                : `Instalar y Activar en ${selectedSites.length} Sitios`}
            </span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
