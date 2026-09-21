'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  pendingUpdatesCount?: number;
  offlineSitesCount?: number;
}

function WPIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.486 2 2 6.486 2 12c0 5.515 4.486 10 10 10 5.514 0 10-4.485 10-10 0-5.514-4.486-10-10-10zm-8.817 10c0-1.743.518-3.364 1.407-4.727l3.87 10.603C5.19 16.273 3.183 14.334 3.183 12zm8.817 8.818c-1.393 0-2.69-.37-3.812-1.015l3.52-10.222 3.606 9.878c.026.066.059.127.09.19-1.077.747-2.383 1.169-3.404 1.169zm1.196-14.739c.652 0 1.258.058 1.258.058.52.03.578-.74.059-.8 0 0-.49-.03-1.037-.059l3.292 9.794 1.21-4.048c.433-1.357.75-2.311.75-3.149 0-1.127-.433-1.675-1.01-1.675-.519 0-1.038.03-1.038.03-.52.029-.462.8.058.8 0 0 .548-.03 1.097-.03.346 0 .577.202.577.635 0 .549-.23 1.386-.462 2.05L16.22 17.51l-4.224-11.431zm6.277 3.518c.86 1.363 1.344 2.955 1.344 4.403 0 2.396-.98 4.56-2.565 6.117l3.843-11.09c.086.19.16.378.22.57h-2.842z"/>
    </svg>
  );
}

export function Sidebar({ pendingUpdatesCount = 0, offlineSitesCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  // Top General Items
  const topNavItems = [
    { label: 'Resumen General', href: '/', icon: LayoutDashboard },
    { label: 'Servicios y Activos', href: '/services', icon: Globe, badge: offlineSitesCount > 0 ? `${offlineSitesCount} caídos` : undefined, badgeVariant: 'danger' },
    { label: 'Clientes e Infraestructura', href: '/clients', icon: Users },
  ];

  // WordPress Specific Submenu Items
  const wpSubItems = [
    { label: 'Actualizaciones Masivas', href: '/updates', icon: RefreshCw, badge: pendingUpdatesCount > 0 ? `${pendingUpdatesCount}` : undefined, badgeVariant: 'warning' },
    { label: 'Plugins y Temas', href: '/plugins', icon: Layers },
    { label: 'Seguridad y Wordfence', href: '/security', icon: ShieldAlert },
    { label: 'Copias de Seguridad', href: '/backups', icon: HardDrive },
    { label: 'Agencia y White-Label', href: '/agency', icon: Sparkles },
    { label: 'Plantillas de Configuración', href: '/templates', icon: Sliders },
  ];

  // Bottom Items
  const bottomNavItems = [
    { label: 'Analítica (6 Meses)', href: '/analytics', icon: BarChart3 },
    { label: 'Ajustes y Canales', href: '/settings', icon: Settings },
  ];

  const isCurrentWpRoute = wpSubItems.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  );

  const [isWpOpen, setIsWpOpen] = useState(true);

  // Keep open when navigating to any WordPress sub-route
  useEffect(() => {
    if (isCurrentWpRoute) {
      setIsWpOpen(true);
    }
  }, [isCurrentWpRoute]);

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 flex flex-col h-screen border-r border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
          <Image
            src="/impulsos-logo.png"
            alt="Impulsos Digitales"
            width={28}
            height={28}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 text-base">
            Sentinel<span className="text-sky-600 dark:text-sky-400">IDPY</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Impulsos Digitales</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm font-medium">
        {/* Top General Items */}
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* WordPress Collapsible Accordion Group */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsWpOpen(!isWpOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              isCurrentWpRoute
                ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900/80 font-semibold border border-slate-200 dark:border-slate-800'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded flex items-center justify-center text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20">
                <WPIcon className="w-3.5 h-3.5" />
              </div>
              <span>WordPress</span>
            </div>

            <div className="flex items-center gap-2">
              {!isWpOpen && pendingUpdatesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                  {pendingUpdatesCount}
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 font-mono">
                CORE
              </span>
              {isWpOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              )}
            </div>
          </button>

          {/* Submenu Items */}
          {isWpOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-1">
              {wpSubItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(subItem.href));

                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isSubActive
                        ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{subItem.label}</span>
                    </div>

                    {subItem.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          subItem.badgeVariant === 'danger'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {subItem.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer / Status */}
      <div className="p-4 pb-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-700 dark:text-slate-300 font-medium">Conexión Global</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Operativo
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Vercel Edge • Neon Postgres</p>

        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Sesión Segura</span>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
