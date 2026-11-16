'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, ArrowRight } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
          <Lock className="w-4 h-4 text-sky-400" />
          <span>OTP</span>
        </h2>
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-sky-400 placeholder:text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-bold"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-950/50 cursor-pointer"
        >
          <span>{isLoading ? 'Verificando...' : 'Acceder al Panel'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-800/80 mx-auto flex items-center justify-center p-3 shadow-xl shadow-sky-950/40">
            <Image
              src="/impulsos-logo.png"
              alt="Logo Impulsos Digitales"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Impulsos <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Digitales</span>
            </h1>
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              Sentinel IDPY
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="text-center text-slate-400 p-8">Cargando autenticación...</div>}>
          <LoginFormContent />
        </Suspense>

        <div className="text-center text-[11px] text-slate-500">
          © {currentYear} Impulsos Digitales • SentinelIDPY v4.2
        </div>
      </div>
    </div>
  );
}
