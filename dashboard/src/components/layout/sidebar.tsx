'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Globe,
  Users,
  RefreshCw,
  Layers,
  ShieldAlert,
  BarChart3,
  HardDrive,
  Sparkles,
  Sliders,
  Settings,
  Server
} from 'lucide-react';

interface SidebarProps {
  pendingUpdatesCount?: number;
  offlineSitesCount?: number;
}

export function Sidebar({ pendingUpdatesCount = 13, offlineSitesCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    { label: 'Resumen General', href: '/', icon: LayoutDashboard },
    { label: 'Sitios y Activos', href: '/sites', icon: Globe, badge: offlineSitesCount > 0 ? `${offlineSitesCount} caídos` : undefined, badgeVariant: 'danger' },
    { label: 'Clientes e Infraestructura', href: '/clients', icon: Users },
    { label: 'Actualizaciones Masivas', href: '/updates', icon: RefreshCw, badge: pendingUpdatesCount > 0 ? `${pendingUpdatesCount}` : undefined, badgeVariant: 'warning' },
    { label: 'Plugins y Temas', href: '/plugins', icon: Layers },
    { label: 'Seguridad y Wordfence', href: '/security', icon: ShieldAlert },
    { label: 'Analítica (6 Meses)', href: '/analytics', icon: BarChart3 },
    { label: 'Copias de Seguridad', href: '/backups', icon: HardDrive },
    { label: 'Agencia y White-Label', href: '/agency', icon: Sparkles },
    { label: 'Plantillas de Configuración', href: '/templates', icon: Sliders },
    { label: 'Ajustes y Canales', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-md">
          <Image
            src="/impulsos-logo.png"
            alt="Impulsos Digitales"
            width={28}
            height={28}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
            Sentinel<span className="text-sky-400">IDPY</span>
          </h1>
          <p className="text-xs text-slate-400">Impulsos Digitales</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Status */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-900/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-300 font-medium">Conexión Global</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Operativo
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Vercel Edge • Neon Postgres</p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Sesión Segura</span>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
