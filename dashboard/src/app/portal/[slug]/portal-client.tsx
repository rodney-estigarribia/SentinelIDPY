'use client';

import React, { useEffect, useState, useTransition } from 'react';
import {
  Eye,
  Users,
  MessageCircle,
  TrendingUp,
  MapPin,
  Smartphone,
  Laptop,
  Mail,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface PortalClientProps {
  siteSlug: string;
  siteName: string;
  subtitle: string;
  siteUrl?: string;
}

interface PortalStats {
  summary: {
    totalPageviews: number;
    uniqueVisitors: number;
    whatsappClicks: number;
    conversionRate: number;
  };
  topCities: Array<{ city: string; count: number }>;
  daily: Array<{
    date: string;
    pageviews: number;
    whatsappClicks: number;
    visitors: number;
  }>;
  devices: {
    mobile: number;
    desktop: number;
    tablet?: number;
  };
}

export function PortalClient({ siteSlug, siteName, subtitle, siteUrl }: PortalClientProps) {
  const [viewState, setViewState] = useState<'initial-loading' | 'loading' | 'auth' | 'dashboard'>('initial-loading');
  const [loadingText, setLoadingText] = useState('Accediendo...');
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [stats, setStats] = useState<PortalStats | null>(null);

  // 1. Initial authentication / token resolution on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      try {
        localStorage.setItem(`portal_token_${siteSlug}`, tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
    }

    let token: string | null = null;
    try {
      token = tokenFromUrl || localStorage.getItem(`portal_token_${siteSlug}`);
    } catch {}

    if (token) {
      setViewState('loading');
      setLoadingText('Accediendo...');
      loadStats(token);
    } else {
      setViewState('auth');
    }
  }, [siteSlug]);

  async function loadStats(token: string) {
    const startTime = Date.now();
    try {
      const res = await fetch(`/api/portal/stats?siteSlug=${encodeURIComponent(siteSlug)}&token=${encodeURIComponent(token)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });

      // Smooth visual threshold (min 450ms)
      const elapsed = Date.now() - startTime;
      if (elapsed < 450) {
        await new Promise((resolve) => setTimeout(resolve, 450 - elapsed));
      }

      if (!res.ok) {
        try {
          localStorage.removeItem(`portal_token_${siteSlug}`);
        } catch {}
        setFeedback({
          type: 'error',
          message: 'El enlace de acceso expiró o no es válido. Ingresá tu correo para recibir uno nuevo.',
        });
        setViewState('auth');
        return;
      }

      const data = await res.json();
      setStats(data);
      setViewState('dashboard');
    } catch {
      setFeedback({
        type: 'error',
        message: 'Error de conexión al cargar estadísticas. Por favor reintente.',
      });
      setViewState('auth');
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteSlug,
          email: emailInput.trim(),
          returnUrl: window.location.origin + window.location.pathname,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: 'Te enviamos un enlace de acceso a tu correo.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'No pudimos verificar tu correo.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Error de conexión con el servidor. Intente nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    try {
      localStorage.removeItem(`portal_token_${siteSlug}`);
    } catch {}
    setStats(null);
    setFeedback(null);
    setViewState('auth');
  }

  // Device calculations
  const totalDevices = stats?.devices
    ? (stats.devices.mobile || 0) + (stats.devices.desktop || 0) + (stats.devices.tablet || 0) || 1
    : 1;
  const mobilePct = stats?.devices ? Math.round(((stats.devices.mobile || 0) / totalDevices) * 100) : 0;
  const desktopPct = 100 - mobilePct;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-emerald-100">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              {siteName}
            </span>
            <span className="text-slate-400 font-normal text-sm sm:text-base">· Estadísticas</span>
          </div>
          <div className="text-xs font-semibold px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full">
            Impulsos Digitales
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* State 1: Loading Spinner */}
        {(viewState === 'loading' || viewState === 'initial-loading') && (
          <div className="max-w-md w-full mx-auto bg-white border border-slate-200/90 rounded-2xl p-10 text-center shadow-sm animate-fade-in">
            <div className="w-11 h-11 mx-auto border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
            <h2 className="mt-5 text-xl font-bold text-slate-900 tracking-tight">{loadingText}</h2>
            <p className="mt-1 text-sm text-slate-500">Validando tu enlace de acceso seguro</p>
          </div>
        )}

        {/* State 2: Auth Login Form */}
        {viewState === 'auth' && (
          <div className="max-w-md w-full mx-auto bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center">
              <Mail className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
              Acceso a estadisticas
            </h1>

            <form onSubmit={handleMagicLinkSubmit} className="space-y-4 text-left">
              <div>
                <label htmlFor="client-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-sm transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#1c2e1e] hover:bg-[#28422b] text-white font-semibold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Acceder</span>
                )}
              </button>
            </form>

            {feedback && (
              <div
                className={`mt-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5 text-left border ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{feedback.message}</span>
              </div>
            )}
          </div>
        )}

        {/* State 3: Real Dashboard View */}
        {viewState === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Actividad</h1>
                <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
              </div>
              <div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Visitas Totales */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Visitas Totales</span>
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.summary.totalPageviews.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-2">Páginas vistas últimos 30 días</div>
              </div>

              {/* Metric 2: Personas Únicas */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Personas Únicas</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.summary.uniqueVisitors.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-2">Visitantes únicos verificados</div>
              </div>

              {/* Metric 3: WhatsApp Clics */}
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-emerald-700 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">WhatsApp Clics 💬</span>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-900 tracking-tight">
                  {stats.summary.whatsappClicks.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-emerald-700 mt-2">Personas que consultaron</div>
              </div>

              {/* Metric 4: Conversión Web */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversión Web</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.summary.conversionRate}%
                </div>
                <div className="text-xs text-slate-400 mt-2">Visitas que tocaron reservar</div>
              </div>
            </div>

            {/* Details Grid (Days & Cities) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column: 7 Days Activity (3 cols) */}
              <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#1c2e1e] mb-4">Actividad de los Últimos 7 Días</h3>
                {stats.daily && stats.daily.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {stats.daily.map((d) => (
                      <div key={d.date} className="py-2.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-600">{d.date.slice(5)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                            👁️ {d.pageviews} visitas
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                            💬 {d.whatsappClicks} WhatsApp
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin datos en los últimos 7 días.</p>
                )}
              </div>

              {/* Right Column: Cities & Devices (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1c2e1e] mb-4">Ciudades de Origen</h3>
                  {stats.topCities && stats.topCities.length > 0 ? (
                    <div className="space-y-2">
                      {stats.topCities.map((c) => (
                        <div
                          key={c.city}
                          className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-none text-sm"
                        >
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {c.city}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                            {c.count} visitas
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Esperando primeras visitas registradas...</p>
                  )}
                </div>

                {/* Devices */}
                <div className="mt-6 pt-4 border-t border-slate-200/80">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Dispositivos</div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" /> Celulares: {mobilePct}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-slate-500" /> Computadoras: {desktopPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-400">
        Infraestructura técnica y monitoreo por{' '}
        <a
          href="https://impulsosdigitales.com.py/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-800 hover:text-emerald-950 transition-colors underline"
        >
          Impulsos Digitales
        </a>
      </footer>
    </div>
  );
}
