'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Award,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Building2,
  Briefcase,
  Layers,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PiggyBank,
  Wallet,
  Receipt,
  FileText
} from 'lucide-react';
import type { Payment, Client, Project } from '@/db/schema';
import { Badge, Note } from '@/components/ui';

interface FinancialSettings {
  currentLadderStep: number;
  targetLadderStep: number;
  targetSalary: number;
  distributionRules: {
    iva: number;
    opex: number;
    reserve: number;
    reinvestment: number;
    salaryAndCushion: number;
  };
  salaryLadder: Array<{
    step: number;
    name: string;
    withdrawableSalary: number;
    avgRequiredBilling: number;
    minCushion: number;
    downgradeRule: string;
    active: boolean;
  }>;
}

interface FinancesClientProps {
  initialPayments: Payment[];
  clients: Client[];
  projects: Project[];
  initialSettings: FinancialSettings;
}

export function FinancesClient({
  initialPayments,
  clients,
  projects,
  initialSettings
}: FinancesClientProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [settings, setSettings] = useState<FinancialSettings>(initialSettings);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>('all');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Payment Form State
  const [newClientId, setNewClientId] = useState<number | ''>(clients[0]?.id || '');
  const [newProjectId, setNewProjectId] = useState<number | ''>('');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('PYG');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newConcept, setNewConcept] = useState('mantenimiento_mensual');
  const [newDescription, setNewDescription] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('transferencia');
  const [newReceiptNumber, setNewReceiptNumber] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Settings Edit State
  const [editCurrentStep, setEditCurrentStep] = useState(settings.currentLadderStep);
  const [editTargetStep, setEditTargetStep] = useState(settings.targetLadderStep);
  const [editTargetSalary, setEditTargetSalary] = useState(settings.targetSalary);

  // Computed Metrics
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalRevenuePYG = completedPayments
    .filter((p) => (p.currency || 'PYG') === 'PYG')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Monthly aggregated billing for 2026
  const monthlyData: { [key: string]: number } = {
    '2026-01': 0,
    '2026-02': 0,
    '2026-03': 0,
    '2026-04': 0,
    '2026-05': 0,
    '2026-06': 0,
    '2026-07': 0,
    '2026-08': 0,
    '2026-09': 0,
    '2026-10': 0,
    '2026-11': 0,
    '2026-12': 0,
  };

  completedPayments.forEach((p) => {
    if (p.date) {
      const monthKey = p.date.substring(0, 7);
      if (monthlyData[monthKey] !== undefined && (p.currency || 'PYG') === 'PYG') {
        monthlyData[monthKey] += p.amount;
      }
    }
  });

  // Calculate 3-month rolling average for recent months (Jun, Jul, Ago)
  const recent3MonthsSum = monthlyData['2026-06'] + monthlyData['2026-07'] + monthlyData['2026-08'];
  const recent3MonthsAvg = Math.round(recent3MonthsSum / 3);

  // Colchón Acumulado Real from Sheet (Ene-Ago: ₲1.583.636)
  // Owner withdrawable salary pool 60% of total billing minus salary drawn
  const activeStepConfig = settings.salaryLadder.find((s) => s.step === settings.currentLadderStep) || settings.salaryLadder[0];
  const targetStepConfig = settings.salaryLadder.find((s) => s.step === settings.targetLadderStep) || settings.salaryLadder[1];
  
  // Real cushion from the spreadsheet: ₲1.583.636
  const accumulatedCushion = 1583636;
  const cushionPercent = Math.min(100, Math.round((accumulatedCushion / activeStepConfig.minCushion) * 100));

  // Simulator gap calculations
  const billingGap = Math.max(0, targetStepConfig.avgRequiredBilling - recent3MonthsAvg);
  const cushionGap = Math.max(0, targetStepConfig.minCushion - accumulatedCushion);
  // Each recurring maintenance client adds ~250.000 PYG/mo
  const maintenanceClientsNeeded = Math.ceil(billingGap / 250000);

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    const client = clients.find((c) => c.id === p.clientId);
    const clientName = client ? client.name.toLowerCase() : '';
    const desc = (p.description || '').toLowerCase();
    const receipt = (p.receiptNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = !query || clientName.includes(query) || desc.includes(query) || receipt.includes(query);
    const matchesClient = selectedClientFilter === 'all' || p.clientId?.toString() === selectedClientFilter;
    const matchesConcept = selectedConceptFilter === 'all' || p.concept === selectedConceptFilter;

    return matchesSearch && matchesClient && matchesConcept;
  });

  // Handler: Create Payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount))) {
      alert('Ingresa un monto numérico válido');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: newClientId ? Number(newClientId) : null,
          projectId: newProjectId ? Number(newProjectId) : null,
          amount: Number(newAmount),
          currency: newCurrency,
          date: newDate,
          concept: newConcept,
          description: newDescription,
          paymentMethod: newPaymentMethod,
          receiptNumber: newReceiptNumber,
          status: 'completed',
          notes: newNotes,
        })
      });

      if (!res.ok) throw new Error('Error al registrar el cobro');
      const saved = await res.json();
      setPayments((prev) => [saved, ...prev]);
      setIsPaymentModalOpen(false);

      // Reset form
      setNewAmount('');
      setNewDescription('');
      setNewReceiptNumber('');
      setNewNotes('');
      setNewProjectId('');
    } catch (err) {
      console.error(err);
      alert('No se pudo registrar el cobro');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Delete Payment
  const handleDeletePayment = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro de cobro?')) return;

    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el cobro');
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el cobro');
    }
  };

  // Handler: Update Financial Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/finances/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLadderStep: editCurrentStep,
          targetLadderStep: editTargetStep,
          targetSalary: editTargetSalary,
          salaryLadder: settings.salaryLadder.map((s) => ({
            ...s,
            active: s.step === editCurrentStep,
          }))
        })
      });

      if (!res.ok) throw new Error('Error al guardar configuración');
      const updated = await res.json();
      setSettings(updated);
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar los escalones financieros');
    } finally {
      setIsSaving(false);
    }
  };

  const monthNames = [
    { key: '2026-01', label: 'Ene' },
    { key: '2026-02', label: 'Feb' },
    { key: '2026-03', label: 'Mar' },
    { key: '2026-04', label: 'Abr' },
    { key: '2026-05', label: 'May' },
    { key: '2026-06', label: 'Jun' },
    { key: '2026-07', label: 'Jul' },
    { key: '2026-08', label: 'Ago' },
    { key: '2026-09', label: 'Sep' },
    { key: '2026-10', label: 'Oct' },
    { key: '2026-11', label: 'Nov' },
    { key: '2026-12', label: 'Dic' },
  ];

  const maxMonthValue = Math.max(...Object.values(monthlyData), 5000000);

  return (
    <div className="space-y-8">
      {/* HEADER BAR & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Estrategia Financiera & Objetivos
            </h2>
            <Badge variant="sky">Año Fiscal 2026</Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Control de cobros de clientes, simulación de escalones de sueldo y reglas de asignación de capital.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Ajustar Escalones</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Cobro</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Facturación Total 2026 */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Facturación Cobrada 2026
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ₲ {totalRevenuePYG.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{completedPayments.length} cobros registrados</span>
              <span className="text-emerald-600 font-semibold">• Ene - Ago</span>
            </p>
          </div>
        </div>

        {/* Card 2: Sueldo Retirable Actual (Escalón 1) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sueldo Mensual Actual
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
                ₲ {activeStepConfig.withdrawableSalary.toLocaleString()}
              </p>
              <span className="text-xs font-semibold text-slate-500">/ mes</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge variant="sky">{activeStepConfig.name} Activo</Badge>
              <span className="text-[11px] text-slate-500">Piso seguro garantizado</span>
            </div>
          </div>
        </div>

        {/* Card 3: Colchón de Seguridad */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fondo de Colchón
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              ₲ {accumulatedCushion.toLocaleString()}
            </p>
            <div className="mt-1.5 space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${cushionPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 flex justify-between">
                <span>{cushionPercent}% de meta</span>
                <span>Objetivo: ₲{activeStepConfig.minCushion.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Promedio Trimestral (Jun - Ago) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Facturación Prom. (Últ. 3M)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              ₲ {recent3MonthsAvg.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">✓ Califica para Escalón 2</span>
              <span>(req. ₲1.700.000)</span>
            </p>
          </div>
        </div>
      </div>

      {/* SALARY LADDER & SIMULATOR SECTION */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900/60 dark:to-slate-950/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Escalones de Sueldo & Simulador de Crecimiento
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tu sueldo como fundador sube de nivel únicamente cuando se consolida la facturación promedio y el colchón mínimo de seguridad.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500">Meta Final de Escala:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ₲ 3.500.000 - ₲ 5.000.000 / mes
            </span>
          </div>
        </div>

        {/* The 4 Ladder Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {settings.salaryLadder.map((step) => {
            const isActive = step.step === settings.currentLadderStep;
            const isTarget = step.step === settings.targetLadderStep;

            return (
              <div
                key={step.step}
                className={`relative p-5 rounded-xl border transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20'
                    : isTarget
                    ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/10 shadow-sm ring-1 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 opacity-75'
                }`}
              >
                {isActive && (
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Nivel Activo</span>
                  </div>
                )}
                {isTarget && !isActive && (
                  <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Próxima Meta</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {step.name}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Nivel {step.step}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Sueldo Retirable:</span>
                    <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      ₲ {step.withdrawableSalary.toLocaleString()}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Facturación Base:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ₲ {step.avgRequiredBilling.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Colchón Mínimo:</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ₲ {step.minCushion.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                      Regla de Seguridad:
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {step.downgradeRule}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Up Simulator Callout */}
        <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Simulador: Requisitos para desbloquear Escalón 2 (₲1.000.000/mes)</span>
            </h4>
            <p className="text-xs text-sky-800 dark:text-sky-300">
              • Facturación: Tu promedio reciente es <strong>₲{recent3MonthsAvg.toLocaleString()}/mes</strong> (Supera los ₲1.700.000 requeridos 🎉).
              <br />
              • Colchón de Seguridad: Tienes <strong>₲{accumulatedCushion.toLocaleString()}</strong> de ₲{targetStepConfig.minCushion.toLocaleString()}.
              {cushionGap > 0 ? (
                <> Faltan <strong>₲{cushionGap.toLocaleString()}</strong> en el colchón para ascender con total tranquilidad.</>
              ) : (
                <> ¡Fondo completado! Listo para consolidar el nuevo sueldo.</>
              )}
            </p>
          </div>

          <div className="shrink-0 p-3 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800/60 text-right">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Recurrencia Recomendada
            </span>
            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
              +2 Mantenimientos WP
            </span>
            <span className="text-[10px] text-slate-500 block">
              a ₲250.000/mes blindan el escalón
            </span>
          </div>
        </div>
      </div>

      {/* PERCENTAGE DISTRIBUTION RULES */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Regla de Distribución de Ingresos (Impulsos Digitales)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cada guaraní cobrado se distribuye automáticamente con base en el sistema financiero de la agencia.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Base Calculada sobre Facturación 2026: <strong className="font-mono text-slate-900 dark:text-white">₲ {totalRevenuePYG.toLocaleString()}</strong>
          </div>
        </div>

        {/* Visual Multi-Color Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800">
          <div style={{ width: '10%' }} className="bg-rose-500 h-full" title="10% IVA Débito Fiscal" />
          <div style={{ width: '15%' }} className="bg-amber-500 h-full" title="15% OPEX Agencia" />
          <div style={{ width: '5%' }} className="bg-purple-500 h-full" title="5% Reserva Operativa" />
          <div style={{ width: '10%' }} className="bg-indigo-500 h-full" title="10% Reinversión" />
          <div style={{ width: '60%' }} className="bg-emerald-500 h-full" title="60% Sueldo & Fondo de Colchón" />
        </div>

        {/* Distribution Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-rose-200/60 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">10% IVA Fiscal</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
              ₲ {Math.round(totalRevenuePYG * 0.10).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Apartado intocable para liquidación tributaria.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">15% OPEX Agencia</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
              ₲ {Math.round(totalRevenuePYG * 0.15).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Servidores, licencias, dominios y hosting.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200/60 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-950/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">5% Reserva Operativa</span>
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
              ₲ {Math.round(totalRevenuePYG * 0.05).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Fondo de emergencia para imprevistos técnicos.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">10% Reinversión</span>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
              ₲ {Math.round(totalRevenuePYG * 0.10).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Marketing, pautas, herramientas y cursos.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">60% Sueldo + Colchón</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-base font-bold font-mono text-slate-900 dark:text-white">
              ₲ {Math.round(totalRevenuePYG * 0.60).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Sueldo fijo retiro + excedente nutre el colchón.
            </p>
          </div>
        </div>
      </div>

      {/* MONTHLY CHART 2026 */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>Evolución Mensual de Cobros 2026</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Facturación real mes a mes comparada con el piso de retiro de sueldo (₲600.000).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Cobrado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400">Piso Sueldo</span>
            </div>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="h-44 flex items-end gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            {monthNames.map((m) => {
              const amount = monthlyData[m.key] || 0;
              const heightPercent = Math.max(8, Math.round((amount / maxMonthValue) * 100));
              const hasData = amount > 0;

              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip */}
                    <div className="absolute -top-9 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono font-bold shadow">
                      ₲ {amount.toLocaleString()}
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${hasData ? heightPercent : 4}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all ${
                        hasData
                          ? 'bg-emerald-500 hover:bg-emerald-400 group-hover:scale-y-105 origin-bottom'
                          : 'bg-slate-100 dark:bg-slate-800/60'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PAYMENTS & BILLING LEDGER TABLE */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span>Libro Mayor de Pagos y Cobranzas</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registro detallado de cada ingreso percibido por cliente, proyecto y concepto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cobro, cliente, recibo..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-60"
              />
            </div>

            {/* Filter by Client */}
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>

            {/* Filter by Concept */}
            <select
              value={selectedConceptFilter}
              onChange={(e) => setSelectedConceptFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Todos los conceptos</option>
              <option value="mantenimiento_mensual">Mantenimiento Mensual</option>
              <option value="anticipo_proyecto">Anticipo Proyecto</option>
              <option value="saldo_proyecto">Saldo Proyecto</option>
              <option value="renovacion_anual">Renovación Hosting/Dominio</option>
              <option value="consultoria">Consultoría / TI</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Concepto & Descripción</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron pagos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const project = projects.find((pr) => pr.id === p.projectId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.date}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client?.name || 'Cliente General'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.concept.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-slate-500 truncate" title={p.description}>
                            {p.description}
                          </div>
                        )}
                        {project && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                            <Briefcase className="w-2.5 h-2.5" />
                            {project.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.receiptNumber || '—'}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {p.currency || 'PYG'} {(p.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            p.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20'
                          }`}
                        >
                          {p.status === 'completed' ? 'Cobrado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar cobro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRAR COBRO / PAGO */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Registrar Nuevo Cobro</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registra un cobro percibido por mantenimiento, anticipo de proyecto o renovación.
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={newClientId}
                    onChange={(e) => {
                      setNewClientId(e.target.value ? Number(e.target.value) : '');
                      setNewProjectId('');
                    }}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Proyecto Asociado (Opcional)
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">Ninguno / General</option>
                    {projects
                      .filter((pr) => !newClientId || pr.clientId === Number(newClientId))
                      .map((pr) => (
                        <option key={pr.id} value={pr.id}>{pr.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monto *
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Ej. 250000"
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Moneda
                  </label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="PYG">PYG (₲ Guaraníes)</option>
                    <option value="USD">USD ($ Dólares)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Cobro *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Concepto
                  </label>
                  <select
                    value={newConcept}
                    onChange={(e) => setNewConcept(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="mantenimiento_mensual">Mantenimiento Mensual</option>
                    <option value="anticipo_proyecto">Anticipo Proyecto (50%)</option>
                    <option value="saldo_proyecto">Saldo de Entrega Proyecto</option>
                    <option value="renovacion_anual">Renovación Dominio / Hosting</option>
                    <option value="consultoria">Consultoría / TI</option>
                    <option value="otro">Otro Servicio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Método de Cobro
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta / Pasarela</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° Factura / Recibo
                  </label>
                  <input
                    type="text"
                    value={newReceiptNumber}
                    onChange={(e) => setNewReceiptNumber(e.target.value)}
                    placeholder="Ej. FAC-2026-027"
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Detalle
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ej. Cuota Mantenimiento Preventivo Septiembre 2026"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Registrando...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTAR ESCALONES & OBJETIVOS */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-500" />
                  <span>Configurar Escalones Financieros</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajusta el nivel activo de sueldo y tus metas financieras.
                </p>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Escalón de Sueldo Activo
                </label>
                <select
                  value={editCurrentStep}
                  onChange={(e) => setEditCurrentStep(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-semibold cursor-pointer"
                >
                  <option value={1}>Escalón 1: ₲ 600.000 / mes (Piso actual)</option>
                  <option value={2}>Escalón 2: ₲ 1.000.000 / mes</option>
                  <option value={3}>Escalón 3: ₲ 1.500.000 / mes</option>
                  <option value={4}>Escalón 4: ₲ 2.000.000 / mes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Próxima Meta (Objetivo Inmediato)
                </label>
                <select
                  value={editTargetStep}
                  onChange={(e) => setEditTargetStep(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-semibold cursor-pointer"
                >
                  <option value={2}>Escalón 2: ₲ 1.000.000 / mes (Req. ₲1.7M fact.)</option>
                  <option value={3}>Escalón 3: ₲ 1.500.000 / mes (Req. ₲2.5M fact.)</option>
                  <option value={4}>Escalón 4: ₲ 2.000.000 / mes (Req. ₲3.35M fact.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Final de Escala (Sueldo Mensual en ₲)
                </label>
                <input
                  type="number"
                  value={editTargetSalary}
                  onChange={(e) => setEditTargetSalary(Number(e.target.value))}
                  placeholder="3500000"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Estrategia: Rango objetivo de ₲3.500.000 a ₲5.000.000/mes.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Ajustes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
