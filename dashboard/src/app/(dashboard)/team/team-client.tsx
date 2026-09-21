'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Copy,
  Check,
  MessageCircle,
  Mail,
  UserCheck,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowRight,
  Briefcase,
  FileText,
  Clock,
  RotateCcw
} from 'lucide-react';
import type { Client } from '@/db/schema';

interface TeamClientProps {
  clients: Client[];
}

interface Snippet {
  id: string;
  title: string;
  tag: string;
  whatsappText: (clientName: string, company: string) => string;
  emailSubject: (company: string) => string;
  emailBody: (clientName: string, company: string) => string;
}

interface Persona {
  id: 'ana' | 'martin' | 'diana' | 'carla';
  name: string;
  role: string;
  department: string;
  email: string;
  avatarColor: string;
  badgeBg: string;
  borderActive: string;
  snippets: Snippet[];
}

export function TeamClient({ clients }: TeamClientProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(clients[0]?.id || null);
  const [activePersona, setActivePersona] = useState<'ana' | 'martin' | 'diana' | 'carla'>('ana');
  const [activeSnippetId, setActiveSnippetId] = useState<string>('ana-1');
  const [customClientName, setCustomClientName] = useState('');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [copiedType, setCopiedType] = useState<'whatsapp' | 'email' | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null;
  const clientName = customClientName || selectedClient?.name || 'Estimado/a';
  const companyName = customCompanyName || selectedClient?.company || selectedClient?.name || 'su empresa';

  const personas: Persona[] = [
    {
      id: 'ana',
      name: 'Ana Rodríguez',
      role: 'Atención Comercial & Cobranzas',
      department: 'Ventas, Renovaciones & Onboarding',
      email: 'info@impulsosdigitales.com.py',
      avatarColor: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/10',
      snippets: [
        {
          id: 'ana-1',
          title: 'Renovación Anual de Hosting & Dominio',
          tag: 'Renovación',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! 👋 Te saluda Ana de Impulsos Digitales.\n\nTe escribo para comentarte que en las próximas semanas corresponde la renovación anual de tu dominio y servidor hosting para ${comp}. Con esto garantizamos que tu web se mantenga 100% activa, rápida y con certificados SSL vigentes. 🚀\n\n¿Te comparto la factura con los datos de transferencia para coordinar la renovación con tiempo? ¡Quedo a las órdenes!`,
          emailSubject: (comp) => `Aviso de Renovación Anual de Dominio y Hosting - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\nEsperamos que te encuentres muy bien. Te saluda Ana Rodríguez del equipo comercial de Impulsos Digitales.\n\nNos ponemos en contacto para coordinar la renovación anual del servicio de hosting y dominio web para ${comp}, correspondiente al nuevo periodo.\n\nMantener la infraestructura al día asegura la disponibilidad continua de su plataforma, backups automáticos diarios y protección perimetral activa.\n\nAdjunto encontrarás el detalle y presupuesto de renovación. Quedamos atentos para emitir la factura correspondiente.\n\nAtentamente,\nAna Rodríguez\nAtención Comercial & Cobranzas | Impulsos Digitales\ninfo@impulsosdigitales.com.py\n+595 992 438 800`
        },
        {
          id: 'ana-2',
          title: 'Seguimiento de Propuesta (Web / Seguridad)',
          tag: 'Comercial',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! 👋 Te saluda Ana de Impulsos Digitales.\n\nQuería dar un breve seguimiento a la propuesta que conversamos para el desarrollo web y optimización de seguridad para ${comp}. 💼\n\n¿Tuvieron oportunidad de revisarla? Si tienen alguna consulta o ajuste en el alcance, con gusto lo coordinamos. ¡Que tengas un excelente día!`,
          emailSubject: (comp) => `Seguimiento de Propuesta de Servicios Digitales - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\nTe saluda Ana Rodríguez de Impulsos Digitales.\n\nTe escribo para consultar si tuvieron oportunidad de evaluar la propuesta comercial enviada para el proyecto de ${comp}.\n\nNos encantaría acompañarles en esta etapa y estamos disponibles para reunirnos o aclarar cualquier requerimiento técnico o financiero que consideren oportuno.\n\nSaludos cordiales,\nAna Rodríguez\nImpulsos Digitales`
        },
        {
          id: 'ana-3',
          title: 'Activación de Proyecto & Solicitud de Anticipo',
          tag: 'Onboarding',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! 🎉 Te saluda Ana de Impulsos Digitales.\n\n¡Qué gusto iniciar este proyecto juntos! Ya tenemos reservado el equipo técnico de Martín para comenzar con la arquitectura de ${comp}. 🛠️\n\nPara formalizar el inicio y agendar las primeras entregas, quedamos atentos al comprobante del anticipo del 50%. Enseguida Diana te comparte la factura legal. ¡Vamos con todo!`,
          emailSubject: (comp) => `Bienvenida e Inicio de Proyecto - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\n¡Es un gusto darles la bienvenida formal a Impulsos Digitales!\n\nConfirmamos la aprobación del proyecto para ${comp}. Nuestro equipo técnico ya se encuentra planificando el cronograma de ejecución.\n\nAdjuntamos la factura proforma correspondiente al anticipo del 50% acordado para dar inicio oficial a la etapa de diseño y maquetación.\n\nCualquier consulta estamos a su entera disposición.\n\nAtentamente,\nAna Rodríguez\nImpulsos Digitales`
        }
      ]
    },
    {
      id: 'martin',
      name: 'Martín Gómez',
      role: 'Líder Técnico & Despliegues',
      department: 'Desarrollo, WordPress & Infraestructura',
      email: 'proyectos@impulsosdigitales.com.py',
      avatarColor: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
      borderActive: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-500/10',
      snippets: [
        {
          id: 'martin-1',
          title: 'Petición de Accesos Técnicos (Waiting on Client)',
          tag: 'Accesos',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! 🛠️ Te saluda Martín de Impulsos Digitales.\n\nPara poder avanzar con la puesta a punto y configuración de la web de ${comp}, necesitamos que nos faciliten los siguientes accesos:\n- Credenciales de acceso a cPanel / Hosting actual\n- Acceso al panel de dominio (nic.py o registrador)\n- Logotipo en alta resolución e imágenes institucionales\n\nQuedo atento por aquí para avanzar de inmediato. ¡Muchas gracias!`,
          emailSubject: (comp) => `Requerimiento de Accesos y Materiales para Proyecto - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\nTe saluda Martín Gómez del equipo técnico de Impulsos Digitales.\n\nPara dar inicio a las configuraciones de infraestructura y desarrollo para ${comp}, requerimos los siguientes datos técnicos:\n\n1. Accesos al proveedor de hosting / cPanel (URL, usuario y contraseña).\n2. Credenciales del registrador de dominio (nic.py u otro).\n3. Material gráfico (manual de marca, logos vectoriales o PNG transparentes, imágenes institucionales).\n\nPueden compartir las credenciales de forma segura respondiendo a este correo o vía Bitwarden/Passwork.\n\nQuedo a su disposición ante cualquier duda.\n\nSaludos cordiales,\nMartín Gómez\nLíder de Proyectos Técnicos | Impulsos Digitales\nproyectos@impulsosdigitales.com.py`
        },
        {
          id: 'martin-2',
          title: 'Entrega de Demo / Avance para Aprobación',
          tag: 'Entregable',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! 🚀 Te saluda Martín de Impulsos Digitales.\n\nTe comparto el enlace de prueba con los avances del sitio de ${comp}: [INSERTAR LINK DEMO].\n\nPueden revisarlo tanto desde el teléfono como desde la computadora. Nos encantaría recibir sus comentarios o visto bueno para coordinar la migración a producción. 🙌`,
          emailSubject: (comp) => `Avance de Desarrollo y Versión Demo Disponible - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\nNos complace informarte que hemos completado la fase principal de desarrollo para ${comp}.\n\nPueden acceder a revisar la versión de prueba en el siguiente enlace:\n👉 [INSERTAR URL DE STAGING]\n\nLes invitamos a verificar textos, enlaces, formularios de contacto y visualización en diferentes dispositivos. Aguardamos sus observaciones o confirmación para proceder con el lanzamiento a producción.\n\nSaludos cordiales,\nMartín Gómez\nImpulsos Digitales`
        },
        {
          id: 'martin-3',
          title: 'Reporte de Mantenimiento Preventivo & Wordfence',
          tag: 'Mantenimiento',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! 🛡️ Te saluda Martín de Impulsos Digitales.\n\nTe comento que hemos ejecutado con éxito la rutina de mantenimiento mensual en el sitio web de ${comp}:\n✅ Respaldo completo de base de datos y archivos generado.\n✅ Actualizaciones de plugins, temas y core aplicadas.\n✅ Escaneo de seguridad Wordfence 100% limpio y sin vulnerabilidades.\n\nTodo funciona de manera óptima. ¡Seguimos cuidando tu plataforma!`,
          emailSubject: (comp) => `Reporte de Mantenimiento Preventivo y Seguridad Realizado - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\nTe saluda Martín Gómez de Impulsos Digitales.\n\nPor medio del presente correo te informamos que nuestro sistema SentinelIDPY ha completado las tareas de mantenimiento preventivo para ${comp}:\n\n- Copia de seguridad completa almacenada fuera de sitio.\n- Actualización de complementos y motor WordPress.\n- Verificación de cortafuegos y análisis antimalware sin anomalías.\n- Comprobación de tiempos de carga y certificados SSL.\n\nSu plataforma se encuentra operando al 100% de rendimiento.\n\nAtentamente,\nMartín Gómez\nImpulsos Digitales`
        }
      ]
    },
    {
      id: 'diana',
      name: 'Diana Martínez',
      role: 'Administración & Finanzas',
      department: 'Facturación Legal & Conciliación Bancaria',
      email: 'administracion@impulsosdigitales.com.py',
      avatarColor: 'bg-purple-600 text-white',
      badgeBg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
      borderActive: 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-500/10',
      snippets: [
        {
          id: 'diana-1',
          title: 'Envío de Factura Legal & Datos Bancarios Itaú',
          tag: 'Facturación',
          whatsappText: (name, comp) =>
            `Estimado/a ${name}, le saluda Diana Martínez del área de Administración de Impulsos Digitales. 📄\n\nLe remitimos la factura electrónica correspondiente a los servicios brindados a ${comp}.\n\nDatos para transferencia SIPAP:\n🏦 Banco: Itaú Paraguay\nTitular: Impulsos Digitales\nCuenta Cte: 720019234\nRUC: 80000001-1\n\nAgradeceremos remitirnos el comprobante bancario para emitir el recibo de dinero. ¡Muchas gracias!`,
          emailSubject: (comp) => `Factura Electrónica y Datos de Pago - ${comp}`,
          emailBody: (name, comp) =>
            `Estimados señores de ${comp},\n\nLes saluda Diana Martínez del Dpto. Administrativo y Financiero de Impulsos Digitales.\n\nAdjunto al presente correo encontrarán la Factura Electrónica legal y el comprobante de liquidación correspondiente a los servicios contratados.\n\nDatos de nuestra cuenta bancaria para transferencias SIPAP:\n- Banco: Banco Itaú Paraguay\n- Titular: Impulsos Digitales\n- Tipo de Cuenta: Cuenta Corriente Guaraníes\n- Número de Cuenta: 720019234\n- RUC: 80000001-1\n\nFavor remitir el comprobante de transferencia bancaria respondiendo a este email para su debida conciliación contable.\n\nAtentamente,\nDiana Martínez\nAdministración & Finanzas\nadministracion@impulsosdigitales.com.py`
        },
        {
          id: 'diana-2',
          title: 'Confirmación de Pago Recibido & Recibo',
          tag: 'Cobranzas',
          whatsappText: (name, comp) =>
            `Estimado/a ${name}, le saluda Diana Martínez de Impulsos Digitales. ✅\n\nConfirmamos la acreditación del pago por parte de ${comp}. Su estado de cuenta se encuentra completamente al día.\n\n¡Muchísimas gracias por su preferencia y confianza!`,
          emailSubject: (comp) => `Confirmación de Pago y Recibo de Cancelación - ${comp}`,
          emailBody: (name, comp) =>
            `Estimados señores de ${comp},\n\nAcusamos recibo satisfactorio de su transferencia bancaria. Hemos registrado el pago en nuestro sistema contable y su cuenta se encuentra debidamente saldada.\n\nAdjuntamos el correspondiente recibo de dinero oficial para sus archivos tributarios.\n\nMuchas gracias por su puntualidad y confianza continua.\n\nCordialmente,\nDiana Martínez\nImpulsos Digitales`
        }
      ]
    },
    {
      id: 'carla',
      name: 'Carla Fernández',
      role: 'Especialista en Contenidos & Redes',
      department: 'Marketing Digital & Identidad Visual',
      email: 'social@impulsosdigitales.com.py',
      avatarColor: 'bg-rose-600 text-white',
      badgeBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
      borderActive: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-500/10',
      snippets: [
        {
          id: 'carla-1',
          title: 'Aprobación de Grilla y Textos del Mes',
          tag: 'Contenidos',
          whatsappText: (name, comp) =>
            `¡Hola ${name}! ✨ Te saluda Carla del equipo de contenidos de Impulsos Digitales.\n\nTe comparto la propuesta de contenidos y publicaciones para ${comp} de las próximas semanas: [LINK DOCUMENTO / CARPETA DRIVE].\n\n¿Le das una mirada y me comentas si te parece bien para iniciar con la programación en redes? ¡Quedo atenta! 📱`,
          emailSubject: (comp) => `Grilla de Contenidos y Creatividades para Aprobación - ${comp}`,
          emailBody: (name, comp) =>
            `Estimado/a ${name},\n\nTe saluda Carla Fernández del equipo de Social Media y Contenidos de Impulsos Digitales.\n\nTe hacemos llegar el calendario mensual de publicaciones y copys propuestos para la comunicación digital de ${comp}.\n\nPuedes acceder al material editable en el siguiente link:\n👉 [ENLACE A GOOGLE DRIVE / NOTION]\n\nQuedamos a la espera de tus comentarios o visto bueno para coordinar la publicación según las fechas previstas.\n\n¡Un cordial saludo!\nCarla Fernández\nImpulsos Digitales`
        }
      ]
    }
  ];

  const currentPersona = personas.find((p) => p.id === activePersona) || personas[0];
  const currentSnippet = currentPersona.snippets.find((s) => s.id === activeSnippetId) || currentPersona.snippets[0];

  const handleCopy = (type: 'whatsapp' | 'email') => {
    let text = '';
    if (type === 'whatsapp') {
      text = currentSnippet.whatsappText(clientName, companyName);
    } else {
      text = `Asunto: ${currentSnippet.emailSubject(companyName)}\n\n${currentSnippet.emailBody(clientName, companyName)}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Operaciones de la Agencia
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              4 Roles Especializados
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Equipo Virtual & Copys Rápidos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Mensajes profesionales optimizados para WhatsApp y Correo Electrónico, listos para enviar a clientes y prospectos firmados por cada miembro del equipo.
          </p>
        </div>

        {/* Client quick selector */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5 shrink-0 min-w-[280px]">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>Personalizar para Cliente:</span>
          </label>
          <select
            value={selectedClientId || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedClientId(val);
              setCustomClientName('');
              setCustomCompanyName('');
            }}
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
          >
            <option value="">-- Cliente Genérico --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Team Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {personas.map((persona) => {
          const isSelected = activePersona === persona.id;
          return (
            <div
              key={persona.id}
              onClick={() => {
                setActivePersona(persona.id);
                setActiveSnippetId(persona.snippets[0]?.id || '');
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? persona.borderActive + ' shadow-md'
                  : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${persona.avatarColor}`}>
                  {persona.name.charAt(0)}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${persona.badgeBg}`}>
                  {persona.snippets.length} plantillas
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {persona.name}
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                  {persona.role}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {persona.department}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="truncate">{persona.email}</span>
                <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-indigo-500' : 'opacity-40'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Snippet Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Snippet Catalog for Active Persona (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Plantillas de {currentPersona.name.split(' ')[0]}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {currentPersona.snippets.length} disponibles
              </span>
            </div>

            <div className="space-y-2">
              {currentPersona.snippets.map((snip) => {
                const isSelected = snip.id === currentSnippet?.id;
                return (
                  <button
                    key={snip.id}
                    onClick={() => setActiveSnippetId(snip.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {snip.tag}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {snip.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick override custom name inputs */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                Ajuste Rápido de Variables:
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={`Nombre (actual: ${clientName})`}
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder={`Empresa (actual: ${companyName})`}
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Preview & Ready to Copy (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {currentSnippet.tag}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    Firma: <strong className="text-slate-800 dark:text-slate-200">{currentPersona.name}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                  {currentSnippet.title}
                </h3>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Destinatario: <span className="font-bold text-emerald-600 dark:text-emerald-400">{clientName}</span> ({companyName})
              </div>
            </div>

            {/* Block 1: WhatsApp Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span>Formato WhatsApp</span>
                </div>

                <button
                  onClick={() => handleCopy('whatsapp')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {copiedType === 'whatsapp' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado al portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar para WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/15 text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                {currentSnippet.whatsappText(clientName, companyName)}
              </div>
            </div>

            {/* Block 2: Email Snippet */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Formato Correo Electrónico</span>
                </div>

                <button
                  onClick={() => handleCopy('email')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {copiedType === 'email' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Copiado con Asunto y Firma!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Correo Completo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/15 text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap leading-relaxed shadow-inner space-y-3">
                <div className="font-semibold text-blue-900 dark:text-blue-300 pb-2 border-b border-blue-200/60 dark:border-blue-800/40">
                  Asunto: {currentSnippet.emailSubject(companyName)}
                </div>
                <div>{currentSnippet.emailBody(clientName, companyName)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
