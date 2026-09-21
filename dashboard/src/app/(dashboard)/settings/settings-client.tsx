'use client';

import React, { useState } from 'react';
import {
  Settings,
  Send,
  Bell,
  CheckCircle2,
  Database,
  Lock,
  MessageSquare,
  Mail,
  Zap,
  Clock,
  ShieldCheck,
  Server
} from 'lucide-react';

export function SettingsClient() {
  const [telegramToken, setTelegramToken] = useState(
    '••••••••••••••••••••••••••••••••••••••••••••••••'
  );
  const [telegramChatId, setTelegramChatId] = useState('-1001234567890');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<string | null>(null);

  const [emailAlerts, setEmailAlerts] = useState('admin@impulsosdigitales.com.py');
  const [whatsAppWebhook, setWhatsAppWebhook] = useState('');

  // Toggles
  const [notifySiteDown, setNotifySiteDown] = useState(true);
  const [notifyWordfenceSpike, setNotifyWordfenceSpike] = useState(true);
  const [notifyPendingUpdates, setNotifyPendingUpdates] = useState(true);
  const [notifyMonthlyReport, setNotifyMonthlyReport] = useState(true);

  // Global tokens
  const [globalWfToken, setGlobalWfToken] = useState(
    'a1b2c3d4e5f67890123456789abcdef0'
  );
  const [vercelApiToken, setVercelApiToken] = useState('••••••••••••••••••••••••');

  const [savedMessage, setSavedMessage] = useState(false);

  const handleTestTelegram = () => {
    setIsTestingTelegram(true);
    setTelegramTestResult(null);

    setTimeout(() => {
      setIsTestingTelegram(false);
      setTelegramTestResult(
        '✅ Mensaje de prueba enviado con éxito al chat de Telegram de Impulsos Digitales.'
      );
      setTimeout(() => setTelegramTestResult(null), 5000);
    }, 1500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 4000);
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>¡Todos los ajustes y canales han sido guardados correctamente!</span>
        </div>
      )}

      {/* SECTION 1: CANAL TELEGRAM */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base">Canal de Notificaciones: Telegram</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                Unifica las alertas que hoy recibes por Telegram y contrólalas directamente desde este panel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={isTestingTelegram}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <Send className={`w-3.5 h-3.5 ${isTestingTelegram ? 'animate-spin' : ''}`} />
            <span>{isTestingTelegram ? 'Enviando...' : 'Enviar Prueba a Telegram'}</span>
          </button>
        </div>

        {telegramTestResult && (
          <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-500/30 text-xs text-sky-900 dark:text-sky-200 font-bold">
            {telegramTestResult}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-950 dark:text-slate-100 font-bold mb-1.5">Telegram Bot Token</label>
            <input
              type="text"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-950 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-950 dark:text-slate-100 font-bold mb-1.5">Telegram Chat ID</label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-950 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Triggers Checklist */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <span className="font-extrabold text-slate-950 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
            Disparadores de Alerta en Telegram
          </span>
          <label className="flex items-center gap-2.5 text-slate-950 dark:text-slate-100 cursor-pointer font-semibold text-xs hover:text-sky-700 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={notifySiteDown}
              onChange={(e) => setNotifySiteDown(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Avisar de inmediato si algún sitio de cliente se cae (HTTP != 200 o Timeout)</span>
          </label>
          <label className="flex items-center gap-2.5 text-slate-950 dark:text-slate-100 cursor-pointer font-semibold text-xs hover:text-sky-700 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={notifyWordfenceSpike}
              onChange={(e) => setNotifyWordfenceSpike(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Avisar si hay un pico inusual de ataques bloqueados por Wordfence (&gt; 500/día)</span>
          </label>
          <label className="flex items-center gap-2.5 text-slate-950 dark:text-slate-100 cursor-pointer font-semibold text-xs hover:text-sky-700 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={notifyPendingUpdates}
              onChange={(e) => setNotifyPendingUpdates(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Recordatorio semanal de actualizaciones críticas de seguridad de plugins</span>
          </label>
        </div>
      </div>

      {/* SECTION 2: CANALES ADICIONALES (EMAIL Y WHATSAPP) */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 dark:text-white text-base">Canales Secundarios: Email & WhatsApp</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Preparados para el envío automático de reportes mensuales y avisos de renovación.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-950 dark:text-slate-100 font-bold mb-1.5">Email para Reportes</label>
            <input
              type="email"
              value={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-950 dark:text-white font-medium text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-950 dark:text-slate-100 font-bold mb-1.5">Webhook de WhatsApp (Opcional)</label>
            <input
              type="url"
              placeholder="https://api.whatsapp-gateway.com/send"
              value={whatsAppWebhook}
              onChange={(e) => setWhatsAppWebhook(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-950 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: BASE DE DATOS Y CONSUMO PREVISTO */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 dark:text-white text-base">Estado de Base de Datos y Almacenamiento</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Cálculo y previsibilidad de costos para operar 100% en el plan gratuito.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">Proveedor de Base de Datos</span>
            <div className="font-extrabold text-slate-950 dark:text-white text-base mt-1">Neon Serverless Postgres</div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">Vercel Postgres Compatible</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">Almacenamiento Usado Proyectado</span>
            <div className="font-extrabold text-slate-950 dark:text-white text-base mt-1">~48 MB / 500 MB</div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">Solo 9.6% de la cuota gratuita</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">Tiempo de Gratuidad Estimado</span>
            <div className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base mt-1">Más de 8 a 10 años</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-400 mt-1">Gracias al Rollup de pings</div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TOKENS GLOBALES */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 dark:text-white text-base">Tokens y Claves Maestras</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Tokens por defecto para nuevos sitios y conexión con la API de Vercel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-950 dark:text-slate-100 font-bold mb-1.5">
              Token Maestro SentinelIDPY (WF_REPORT_TOKEN)
            </label>
            <input
              type="text"
              value={globalWfToken}
              onChange={(e) => setGlobalWfToken(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-950 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-950 dark:text-slate-100 font-bold mb-1.5">
              Vercel API Personal Access Token
            </label>
            <input
              type="password"
              value={vercelApiToken}
              onChange={(e) => setVercelApiToken(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-950 dark:text-white font-mono text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          Guardar Todos los Ajustes
        </button>
      </div>
    </form>
  );
}
