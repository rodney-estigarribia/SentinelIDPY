'use client';

import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Layers,
  Database,
  FileCode,
  Hand,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { ConfigTemplate, Site } from '@/db/schema';

interface TemplatesClientProps {
  initialTemplates: ConfigTemplate[];
  sites: Site[];
}

export function TemplatesClient({ initialTemplates, sites }: TemplatesClientProps) {
  const [templates] = useState<ConfigTemplate[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id || 1);
  const [selectedSiteId, setSelectedSiteId] = useState<number>(sites[0]?.id || 1);

  const [isApplying, setIsApplying] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const currentSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Mock client current config vs template for drift calculation
  const mockClientConfigs: Record<number, any> = {
    // Wordfence template drift
    1: {
      loginSec_maxFailures: 10, // Drift! Template is 5
      loginSec_maxForgotPassFailures: 5, // Drift! Template is 3
      loginSec_countTime: 1200, // Match
      loginSec_lockoutDuration: 7200, // Match
      loginSec_userBlacklist: 'admin, test', // Drift! Template has more
      liveTrafficEnabled: false, // Match
    },
    // Cache template drift
    2: {
      cache_page: true,
      cache_priv: false,
      css_minify: false, // Drift! Template is true
      js_minify: false, // Drift! Template is true
      optm_webp: true,
    },
  };

  const clientCurrentConfig = mockClientConfigs[currentTemplate.id] || currentTemplate.payload;

  // Calculate drift items
  const payloadObj = (currentTemplate.payload as Record<string, any>) || {};
  const driftItems = Object.entries(payloadObj).map(([key, templateValue]) => {
    const clientValue = clientCurrentConfig[key];
    const isDrift = JSON.stringify(templateValue) !== JSON.stringify(clientValue);
    return {
      key,
      templateValue: String(templateValue),
      clientValue: clientValue !== undefined ? String(clientValue) : 'No configurado',
      isDrift,
    };
  });

  const totalDrift = driftItems.filter((d) => d.isDrift).length;

  const handleApplyTemplate = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Template Selector & Info (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Plantillas Maestras ({templates.length})</h3>

        <div className="space-y-2">
          {templates.map((t) => {
            const isSelected = t.id === selectedTemplateId;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/10 dark:border-blue-500/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{t.description}</p>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <Database className="w-3 h-3" />
                    Automático (wp_options)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Classification Guide Card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-2.5 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            Capas de Configuración
          </h4>
          <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white">Base de Datos (`wp_options`)</strong>:{' '}
              <span className="text-slate-600 dark:text-slate-400">100% automatizable vía API REST remota sin tocar código.</span>
            </span>
          </div>
          <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white">Archivos de Disco (`.htaccess`, `wp-config.php`)</strong>:{' '}
              <span className="text-slate-600 dark:text-slate-400">Aplicable con permisos de escritura de servidor.</span>
            </span>
          </div>
          <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
            <span>
              <strong className="text-slate-900 dark:text-white">Ajustes Manuales</strong>:{' '}
              <span className="text-slate-600 dark:text-slate-400">Parámetros de terceros con guía de pasos.</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Drift Inspector & Comparison (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Site Selector Bar */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Comparativa de Configuración (Drift)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analizando plantilla: <span className="text-slate-900 dark:text-white font-semibold">{currentTemplate.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 dark:text-slate-400">Comparar con:</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(Number(e.target.value))}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.url.replace(/^https?:\/\//, '')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drift Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${
            totalDrift > 0
              ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10'
              : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            {totalDrift > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {totalDrift > 0
                  ? `Se detectaron ${totalDrift} diferencias (Drift) en ${currentSite.name}`
                  : `¡Configuración 100% alineada con la plantilla maestra!`}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {totalDrift > 0
                  ? 'La configuración del cliente difiere del estándar recomendado de la agencia.'
                  : 'Este sitio cumple todas las directivas de seguridad y optimización.'}
              </p>
            </div>
          </div>

          {totalDrift > 0 && (
            <button
              onClick={handleApplyTemplate}
              disabled={isApplying}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm cursor-pointer"
            >
              {isApplying ? 'Sincronizando...' : 'Sobrescribir con Plantilla'}
            </button>
          )}
        </div>

        {syncSuccess && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            ✅ ¡Configuración sobrescrita y sincronizada con éxito en {currentSite.name}!
          </div>
        )}

        {/* Drift Comparison Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Parámetro / Clave</th>
                <th className="py-3 px-4">Valor en Plantilla Maestra</th>
                <th className="py-3 px-4">Valor Actual en {currentSite.name}</th>
                <th className="py-3 px-4 text-right">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {driftItems.map((item) => (
                <tr
                  key={item.key}
                  className={`transition-colors ${
                    item.isDrift ? 'bg-amber-50/40 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.key}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400">{item.templateValue}</td>
                  <td
                    className={`py-3 px-4 font-mono font-semibold ${
                      item.isDrift ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.clientValue}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.isDrift ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        Diferencia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Idéntico
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
