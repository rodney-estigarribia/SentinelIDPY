'use client';

import React from 'react';
import { Search, Bell, ExternalLink, RefreshCw } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ title, subtitle, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="py-5 lg:py-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-8 lg:px-10 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="space-y-1">
        {title && <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>}
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar sitio, cliente o IP..."
            className="w-72 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Global Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Sincronizar métricas de todos los sitios"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>
        )}

        {/* Theme Mode Toggle (System Auto, Light, Dark) */}
        <ThemeToggle />

        {/* Impulsos Digitales Agency Link */}
        <a
          href="https://impulsosdigitales.com.py"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
        >
          <span>Impulsos Digitales</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
}
