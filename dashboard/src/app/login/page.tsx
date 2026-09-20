'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Server, Copy, Check, HelpCircle } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const secretKey = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('El código debe tener exactamente 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(data.error || 'Código OTP inválido o expirado.');
        setCode('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setError('Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Autenticación en Dos Pasos (TOTP)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Ingresa el código dinámico de 6 dígitos generado por tu app de autenticación (Google Authenticator, Authy, etc.).
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-xs font-semibold text-rose-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoComplete="one-time-code"
            placeholder="••••••"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(val);
              if (val.length === 6) {
                setTimeout(() => {
                  const form = e.target.form;
                  if (form) form.requestSubmit();
                }, 100);
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-950 cursor-pointer"
        >
          <span>{isLoading ? 'Verificando...' : 'Acceder al Panel'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* First-time Setup Helper Accordion */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>¿Cómo vincular tu app de autenticación?</span>
        </button>

        {showHelper && (
          <div className="mt-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-300">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              1. Abre <strong>Google Authenticator</strong> (o tu app de OTP favorita).<br />
              2. Toca en <strong>Añadir cuenta (+)</strong> → <strong>Ingresar clave de configuración</strong>.<br />
              3. En nombre pon <code>SentinelIDPY</code> y en clave pega:
            </p>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300">
              <span className="truncate">{secretKey}</span>
              <button
                onClick={handleCopySecret}
                className="p-1 text-slate-400 hover:text-white"
                title="Copiar clave"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copied && <p className="text-[10px] text-emerald-400 font-semibold">¡Copiado al portapapeles!</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950">
            <Server className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sentinel<span className="text-emerald-400">IDPY</span>
          </h1>
          <p className="text-xs text-slate-400">Impulsos Digitales • Acceso de Administrador</p>
        </div>

        <Suspense fallback={<div className="text-center text-slate-400 p-8">Cargando autenticación...</div>}>
          <LoginFormContent />
        </Suspense>

        <div className="text-center text-[11px] text-slate-400">
          Protegido por RFC 6238 TOTP • SentinelIDPY v4.2
        </div>
      </div>
    </div>
  );
}
