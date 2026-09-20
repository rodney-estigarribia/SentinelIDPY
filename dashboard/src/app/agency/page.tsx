import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { dataService } from '@/lib/data-service';
import { Sparkles, Sliders, ExternalLink, Shield, CheckCircle2 } from 'lucide-react';

export const revalidate = 0;

export default async function AgencyPage() {
  const sites = await dataService.getSites({ type: 'wordpress' });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Agencia y Personalización White-Label"
        subtitle="Control remoto de pantallas de login, marcas de cliente, pies de página y depuración de menús"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Intro Card */}
        <div className="p-5 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-950/20 to-slate-900/60 space-y-2">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Gestión Remota de Identidad de Marca</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Personaliza el logotipo y el fondo de inicio de sesión de WordPress de cada cliente para entregar una experiencia 100% profesional. Compatible tanto con filtros nativos ultraligeros de SentinelIDPY Connector como con plugins como White Label CMS y Admin Menu Editor.
          </p>
        </div>

        {/* Sites Branding Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-white text-sm">{site.name}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Branded
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate">{site.url}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Logo Login:</span>
                  <span className="text-emerald-400 font-semibold">Personalizado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fondo:</span>
                  <span className="text-slate-300 font-mono">#0f172a (Dark Slate)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pie de Página:</span>
                  <span className="text-slate-300 truncate max-w-[140px]">Impulsos Digitales</span>
                </div>
              </div>

              <Link
                href={`/sites/${site.id}`}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center block transition-colors border border-slate-700"
              >
                Editar Branding en Cockpit
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
