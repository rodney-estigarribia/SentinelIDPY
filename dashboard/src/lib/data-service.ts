import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import type {
  Client,
  Site,
  Service,
  NewClient,
  NewSite,
  NewService,
  ConfigTemplate,
  ServiceGroup,
  NewServiceGroup,
  Project,
  NewProject,
  Payment,
  NewPayment,
  ClientTimelineEvent
} from '@/db/schema';

// Initial seed data from clientes.json, SERVICIOS Y RENOVACIONES CLIENTES and infrastructure mappings
const INITIAL_CLIENTS: Array<Client> = [
  {
    id: 1,
    name: 'IDPY (Impulsos Digitales)',
    legalName: 'Impulsos Digitales',
    ruc: '80000001-1',
    email: 'admin@impulsosdigitales.com.py',
    phone: '+595 992 438 800',
    company: 'Impulsos Digitales',
    notes: 'Agencia matriz y portal administrativo',
    status: 'active',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/idpy-admin',
    timeline: [
      {
        id: 't-1-1',
        year: '2022',
        title: 'Fundación de Impulsos Digitales',
        description: 'Inicio de operaciones de consultoría cloud y desarrollo digital.',
        category: 'milestone',
        actor: 'rodney'
      },
      {
        id: 't-1-2',
        year: '2026',
        title: 'Despliegue Plataforma SentinelIDPY',
        description: 'Lanzamiento de plataforma centralizada de telemetría y operaciones.',
        category: 'upgrade',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2027-03-15', annualCost: 150000, currency: 'PYG', notes: 'Renovación automática' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'VPS Pro', annualCost: 1200000, currency: 'PYG', notes: 'Servidor principal' },
      dns: { provider: 'Cloudflare', notes: 'DNS primario con proxy activado' },
      email: { provider: 'Microsoft 365', accountsCount: 5, annualCost: 360, currency: 'USD' },
      systems: [{ name: 'SentinelIDPY Panel', type: 'Vercel', plan: 'Hobby/Pro' }]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'CGA Corporativo',
    legalName: 'CONSULTORA DE GESTIÓN AMBIENTAL',
    ruc: '80092994-2',
    email: 'cgasociedadanonima@gmail.com',
    phone: '+595 981 234567',
    company: 'CGA Consultora de Gestión Ambiental S.A.',
    notes: 'Cliente corporativo - Web institucional, Portal de clientes y Mantenimiento Plan Elite',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cga-gestion-ambiental',
    timeline: [
      {
        id: 't-2-1',
        year: '2022',
        title: 'Desarrollo Web Institucional',
        description: 'Sitio corporativo y estructuración de presencia digital.',
        category: 'milestone',
        actor: 'martin'
      },
      {
        id: 't-2-2',
        year: '2024',
        title: 'Lanzamiento Portal CGA en Vercel',
        description: 'Aplicación web para gestión interna de reportes ambientales.',
        category: 'upgrade',
        actor: 'martin'
      },
      {
        id: 't-2-3',
        year: '2026',
        title: 'Contrato Mantenimiento Plan Elite',
        description: 'Mantenimiento mensual recurrente activo (₲250.000 / mes).',
        category: 'upgrade',
        actor: 'ana'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-12-15', annualCost: 150000, currency: 'PYG', notes: 'Lo hace el cliente - Vence en diciembre' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG', notes: 'Lo hace el cliente - Vence anual en agosto' },
      dns: { provider: 'cPanel Host', notes: 'DNS en cPanel' },
      email: { provider: 'cPanel Webmail', accountsCount: 8, annualCost: 0, currency: 'PYG' },
      systems: [{ name: 'CGA Portal', type: 'Vercel', plan: 'Impulsos Digitales Plan' }]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: 'CGA Portal',
    legalName: 'CONSULTORA DE GESTIÓN AMBIENTAL',
    ruc: '80092994-2',
    email: 'cgasociedadanonima@gmail.com',
    phone: '+595 981 234567',
    company: 'CGA Consultora de Gestión Ambiental S.A.',
    notes: 'Portal web interno de clientes alojado en Vercel',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cga-portal-app',
    timeline: [
      {
        id: 't-3-1',
        year: '2024',
        title: 'Despliegue Portal Clientes',
        description: 'Subdominio portal.cga.com.py conectado a Vercel.',
        category: 'milestone',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py (Subdominio)', renewer: 'agency', expiryDate: '2026-11-20', annualCost: 0, currency: 'PYG' },
      hosting: { provider: 'Vercel', plan: 'Impulsos Digitales', annualCost: 0, currency: 'USD' },
      dns: { provider: 'cPanel DNS CNAME', notes: 'portal.cga.com.py -> cname.vercel-dns.com' },
      email: { provider: 'Mismo que CGA', accountsCount: 0 }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    name: 'Cope Market Deli',
    legalName: 'Cope Market Deli S.A.',
    ruc: '80123456-7',
    email: 'contacto@copemarketdeli.com.py',
    phone: '+595 981 345678',
    company: 'Cope Market Deli',
    notes: 'Cliente histórico con quienes trabajamos mucho tiempo. Dado de baja en 2026 por cese comercial.',
    status: 'churned',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/copemarket-historico',
    timeline: [
      {
        id: 't-4-1',
        year: '2021',
        title: 'Inicio de Servicios Web & E-Commerce',
        description: 'Desarrollo de catálogo gastronómico en WordPress y hosting.',
        category: 'milestone',
        actor: 'rodney'
      },
      {
        id: 't-4-2',
        year: '2023',
        title: 'Renovación y Optimización de Catálogo',
        description: 'Integración de pedidos y pasarelas de mensajería.',
        category: 'upgrade',
        actor: 'martin'
      },
      {
        id: 't-4-3',
        year: '2026',
        title: 'Baja del Servicio (Cese Comercial)',
        description: 'El cliente cerró operaciones comerciales y se dio de baja el servicio.',
        category: 'churn',
        actor: 'diana'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2027-01-10', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 380000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Google Workspace', accountsCount: 3, annualCost: 216, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    name: 'Dagda',
    legalName: 'Dagda Comunicación & Eventos EAS',
    ruc: '80138071-5',
    email: 'armando_cubilla@hotmail.com',
    phone: '+595 981 456789',
    company: 'Dagda Comunicación & Eventos EAS',
    notes: 'Ecosistema completo: web institucional, webapp, app móvil y backend en Render.',
    status: 'active',
    acquisitionChannel: 'network',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dagda-eventos-2026',
    timeline: [
      {
        id: 't-5-1',
        year: '2023',
        title: 'Lanzamiento Inicial Plataforma Dagda',
        description: 'Web en cPanel, Backend Node en Render Postgres y despliegue App Móvil.',
        category: 'milestone',
        actor: 'martin'
      },
      {
        id: 't-5-2',
        year: '2025',
        title: 'Publicación en Apple Store y Google Play',
        description: 'Renovación anual de membresías de desarrollador con la agencia.',
        category: 'upgrade',
        actor: 'martin'
      },
      {
        id: 't-5-3',
        year: '2026',
        title: 'Proyecto App v2 en Progreso',
        description: 'Desarrollo de nuevas funcionalidades y optimización de arquitectura.',
        category: 'upgrade',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-12-05', annualCost: 150000, currency: 'PYG', notes: 'Paga TC Rodney / Agencia' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG', notes: 'Paga TC Cliente' },
      dns: { provider: 'Hosting Paraguay (cPanel)', notes: 'Apunta a web y registros M365' },
      email: { provider: 'Microsoft 365', accountsCount: 4, annualCost: 288, currency: 'USD', notes: 'Paga TC Cliente' },
      systems: [
        { name: 'Backend API & Base de Datos (Render Postgres)', type: 'Render', cost: 15, plan: 'Postgres Managed + Web Service (Paga TC Cliente)' },
        { name: 'App Móvil (Android & iOS)', type: 'Mobile App', plan: 'Nativa (Renueva mayo con agencia)' },
        { name: 'Web App & Panel Admin (Angular)', type: 'Hosting Paraguay cPanel', plan: 'Roadmap: Migrar a React en Vercel' },
        { name: 'Licencia Office 365', type: 'Microsoft', cost: 99, plan: 'M365 Business' }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    name: 'GeneSur',
    legalName: 'GENE SUR SRL',
    ruc: '80017259-0',
    email: 'info@genesur.com.py',
    phone: '+595 981 567890',
    company: 'GeneSur Genética Bovina',
    notes: 'Catálogo de genética e inseminación bovina - Mantenimiento Plan Elite',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/genesur-srl',
    timeline: [
      {
        id: 't-6-1',
        year: '2022',
        title: 'Desarrollo Catálogo Genético',
        description: 'Plataforma WordPress con fichas técnicas descargables.',
        category: 'milestone',
        actor: 'martin'
      },
      {
        id: 't-6-2',
        year: '2026',
        title: 'Soporte y Crecimiento Plan Elite',
        description: 'Mantenimiento mensual activo y consultoría continua.',
        category: 'upgrade',
        actor: 'ana'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2027-02-18', annualCost: 150000, currency: 'PYG', notes: 'Lo hace el cliente' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG', notes: 'Lo hace el cliente' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Microsoft 365', accountsCount: 6, annualCost: 432, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    name: 'Navíos Argentina',
    legalName: 'Navíos Logistics Argentina S.A.',
    ruc: '30-71234567-9',
    email: 'contacto@naviosargentina.com',
    phone: '+54 11 4321 0000',
    company: 'Navíos Logistics',
    notes: 'Portal logístico regional',
    status: 'active',
    acquisitionChannel: 'network',
    driveFolderUrl: 'https://drive.google.com/drive/folders/navios-argentina',
    timeline: [
      {
        id: 't-7-1',
        year: '2023',
        title: 'Implementación Portal Regional',
        description: 'Infraestructura corporativa en la nube.',
        category: 'milestone',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'GoDaddy (.com)', renewer: 'client', expiryDate: '2026-10-30', annualCost: 20, currency: 'USD' },
      hosting: { provider: 'AWS / cPanel', plan: 'Corporate VPS', annualCost: 1200, currency: 'USD' },
      dns: { provider: 'AWS Route53' },
      email: { provider: 'Microsoft 365', accountsCount: 25, annualCost: 1800, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 8,
    name: 'Synexa',
    legalName: 'SYNEXA E.A.S.',
    ruc: '80138132-0',
    email: 'contacto@synexa.com.py',
    phone: '+595 981 678901',
    company: 'Synexa Soluciones Tecnológicas',
    notes: 'Landing tecnológica y captación B2B en Next.js / Vercel',
    status: 'active',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/synexa-eas',
    timeline: [
      {
        id: 't-8-1',
        year: '2024',
        title: 'Despliegue Landing Next.js',
        description: 'Implementación rápida con alta velocidad de carga y SEO.',
        category: 'milestone',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-09-15', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Vercel Onepage', plan: 'Impulsos Digitales', annualCost: 0, currency: 'USD' },
      dns: { provider: 'Cloudflare' },
      email: { provider: 'Google Workspace', accountsCount: 2, annualCost: 144, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 9,
    name: 'Misa Guarani',
    legalName: 'MEAURIO MANCUELLO CLAUDIA LORENA',
    ruc: '5415611-4',
    email: 'contacto@misaguarani.com',
    phone: '+595 981 789012',
    company: 'Fundación Cultural Misa Guaraní',
    notes: 'Sitio cultural multimedia y fonoteca - Mantenimiento Plan Pro',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/misa-guarani-2026',
    timeline: [
      {
        id: 't-9-1',
        year: '2024',
        title: 'Lanzamiento Fonoteca Cultural',
        description: 'Digitalización y reproducción de archivos sacros y culturales.',
        category: 'milestone',
        actor: 'rodney'
      },
      {
        id: 't-9-2',
        year: '2026',
        title: 'Renovación Plan Pro Mantenimiento',
        description: 'Renovación anual completada el 29-04-2026 (Plan Pro).',
        category: 'upgrade',
        actor: 'diana'
      }
    ],
    infrastructure: {
      domain: { provider: 'Namecheap (.com)', renewer: 'client', expiryDate: '2027-04-12', annualCost: 16, currency: 'USD', notes: 'Lo hace el cliente' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 10GB', annualCost: 550000, currency: 'PYG', notes: 'Lo hace el cliente' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'cPanel Webmail', accountsCount: 3, annualCost: 0, currency: 'PYG' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 10,
    name: 'My Life',
    legalName: 'Carolina Sosky',
    ruc: '1502805-4',
    email: 'carososky@hotmail.com',
    phone: '+595 981 890123',
    company: 'My Life Nutrición & Bienestar',
    notes: 'Portal institucional de salud y consultas',
    status: 'active',
    acquisitionChannel: 'social',
    driveFolderUrl: 'https://drive.google.com/drive/folders/my-life-nutricion',
    timeline: [
      {
        id: 't-10-1',
        year: '2023',
        title: 'Desarrollo Web en WordPress',
        description: 'Plataforma con agenda y recursos descargables.',
        category: 'milestone',
        actor: 'martin'
      },
      {
        id: 't-10-2',
        year: '2026',
        title: 'Hosting renovado con la agencia',
        description: 'Renovación de hosting gestionada por nosotros (vencimiento abril).',
        category: 'upgrade',
        actor: 'ana'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-09-28', annualCost: 150000, currency: 'PYG', notes: 'Lo hace el cliente - Vence en septiembre' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 15GB', annualCost: 650000, currency: 'PYG', notes: 'Renueva con nosotros - Vence en abril' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Google Workspace', accountsCount: 8, annualCost: 576, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 11,
    name: 'CNA',
    legalName: 'MEAURIO MANCUELLO CLAUDIA LORENA',
    ruc: '5415611-4',
    email: 'contacto@cna.com.py',
    phone: '+595 981 999888',
    company: 'CNA Consultora',
    notes: 'Sitio institucional con mantenimiento',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cna-consultora',
    timeline: [
      {
        id: 't-11-1',
        year: '2024',
        title: 'Lanzamiento Web Institucional',
        description: 'Sitio web WordPress corporativo.',
        category: 'milestone',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-11-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 350000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 12,
    name: 'Medopharm',
    legalName: 'MEDOPHARM SA',
    ruc: '80027325-7',
    email: 'com@medopharm.com.py',
    phone: '+595 21 500 100',
    company: 'Medopharm S.A.',
    notes: 'Tuvieron web WordPress con nosotros, luego migraron externamente a Wix.',
    status: 'migrated',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/medopharm-historico',
    timeline: [
      {
        id: 't-12-1',
        year: '2023',
        title: 'Desarrollo Web en WordPress',
        description: 'Sitio web institucional farmacéutico en WordPress.',
        category: 'milestone',
        actor: 'rodney'
      },
      {
        id: 't-12-2',
        year: '2024',
        title: 'Soporte y Actualizaciones',
        description: 'Mantenimiento técnico preventivo y seguridad.',
        category: 'note',
        actor: 'martin'
      },
      {
        id: 't-12-3',
        year: '2025',
        title: 'Migración Externa a Wix',
        description: 'El cliente decidió migrar su plataforma a Wix por autogestión; se finalizó el hosting WordPress.',
        category: 'migration',
        actor: 'ana'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-10-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Wix (Externo)', plan: 'Wix Premium', annualCost: 0, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 13,
    name: 'Mercopar',
    legalName: 'MEAURIO MANCUELLO CLAUDIA LORENA',
    ruc: '5415611-4',
    email: 'contacto@mercopar.com.py',
    phone: '+595 981 777666',
    company: 'Mercopar S.A.',
    notes: 'Portal corporativo e importaciones',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/mercopar',
    timeline: [
      {
        id: 't-13-1',
        year: '2024',
        title: 'Desarrollo Web y Catálogo',
        description: 'Presencia corporativa y estructura de catálogo.',
        category: 'milestone',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-11-15', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 350000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 14,
    name: 'Repar',
    legalName: 'Repar Soluciones Técnicas',
    ruc: '80145000-3',
    email: 'contacto@repar.com.py',
    phone: '+595 981 112233',
    company: 'Repar Soluciones',
    notes: 'Nuevo cliente: Proyecto web corporativo en diseño y consultoría de seguridad digital en relevamiento.',
    status: 'lead',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/repar-2026',
    timeline: [
      {
        id: 't-14-1',
        year: '2026',
        title: 'Inicio de Relación Comercial',
        description: 'Contacto inicial y propuesta de Web Corporativa + Hardening de Seguridad Digital.',
        category: 'milestone',
        actor: 'ana'
      },
      {
        id: 't-14-2',
        year: '2026',
        title: 'Aprobación y Anticipo Web',
        description: 'Web corporativa entra en fase de diseño de interfaz (En progreso).',
        category: 'upgrade',
        actor: 'martin'
      }
    ],
    infrastructure: {
      domain: { provider: 'nic.py (En gestión)', renewer: 'agency', expiryDate: '2027-09-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

function seedSite(data: Partial<Site> & { id: number; name: string; type: string; url: string }): Site {
  return {
    clientId: null,
    token: null,
    diskAllocatedGb: null,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: null,
    lastCheckedAt: new Date(),
    lastBackupAt: null,
    wpVersion: null,
    phpVersion: null,
    sslDaysLeft: null,
    siteHealthScore: null,
    pendingUpdates: null,
    wordfenceStats: null,
    performanceInfo: null,
    metadata: null,
    category: data.category || (data.type === 'wordpress' ? 'web_wordpress' : data.type === 'vercel' ? 'vercel' : 'web_app'),
    provider: null,
    billing: null,
    relationships: null,
    roadmapNotes: null,
    serviceGroup: data.serviceGroup || 'General',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}

const RAW_INITIAL_SITES: Array<Partial<Site> & { id: number; name: string; type: string; url: string }> = [
  {
    id: 1,
    clientId: 1,
    name: 'IDPY Admin',
    type: 'wordpress',
    url: 'https://admin.impulsosdigitales.com.py',
    token: process.env.WF_REPORT_TOKEN || '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f',
    diskAllocatedGb: 10,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 245,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 36 * 3600 * 1000),
    wpVersion: '6.7.1',
    phpVersion: '8.2.24',
    sslDaysLeft: 84,
    siteHealthScore: { status: 'good', good: 16, recommended: 2, critical: 0 },
    pendingUpdates: {
      plugins: 0,
      themes: 0,
      wordpress: 0,
      details: []
    },
    wordfenceStats: {
      totalAttacks: 1420,
      lastScan: '2026-09-19 04:12:00',
      rulesOk: true,
      rulesDetail: 'Actualizadas al día',
      topIps: [
        { ip: '194.26.29.112', count: 412 },
        { ip: '45.154.255.89', count: 285 },
        { ip: '185.196.8.44', count: 198 }
      ],
      topUrls: [
        { url: '/wp-login.php', count: 830 },
        { url: '/xmlrpc.php', count: 320 },
        { url: '/wp-content/plugins/test/', count: 110 }
      ],
      topUsernames: [
        { user: 'admin', count: 540 },
        { user: 'administrator', count: 210 },
        { user: 'rodney', count: 85 }
      ]
    },
    performanceInfo: { cachePlugin: 'LiteSpeed Cache', cacheEnabled: true, siteSizeGb: 4.8, diskFreeGb: 5.2 },
    metadata: { notes: 'Portal central de administración' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    clientId: 2,
    name: 'CGA Corporativo',
    type: 'wordpress',
    url: 'https://cga.com.py',
    token: process.env.WF_REPORT_TOKEN || '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f',
    diskAllocatedGb: 2.1,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 310,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 48 * 3600 * 1000),
    wpVersion: '6.7.1',
    phpVersion: '8.1.30',
    sslDaysLeft: 52,
    siteHealthScore: { status: 'good', good: 14, recommended: 3, critical: 0 },
    pendingUpdates: {
      plugins: 0,
      themes: 0,
      wordpress: 0,
      details: []
    },
    wordfenceStats: {
      totalAttacks: 890,
      lastScan: '2026-09-18 22:30:00',
      rulesOk: true,
      rulesDetail: 'Actualizadas'
    },
    performanceInfo: { cachePlugin: 'WP Super Cache', cacheEnabled: true, siteSizeGb: 1.2, diskFreeGb: 0.9 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    clientId: 3,
    name: 'CGA Portal Clientes',
    type: 'vercel',
    url: 'https://portal.cga.com.py',
    token: '',
    diskAllocatedGb: 2.1,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 120,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(),
    sslDaysLeft: 70,
    wpVersion: null,
    phpVersion: null,
    siteHealthScore: null,
    pendingUpdates: null,
    wordfenceStats: null,
    performanceInfo: null,
    metadata: { vercelProjectId: 'prj_cga_portal_2026', gitRepo: 'github.com/impulsosdigitales/cga-portal' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    clientId: 4,
    name: 'Cope Market Deli',
    type: 'wordpress',
    url: 'https://copemarketdeli.com.py',
    token: process.env.WF_REPORT_TOKEN || '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f',
    diskAllocatedGb: 0.5,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 420,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 72 * 3600 * 1000),
    wpVersion: '6.6.2',
    phpVersion: '8.1.30',
    sslDaysLeft: 41,
    siteHealthScore: { status: 'recommended', good: 12, recommended: 4, critical: 0 },
    pendingUpdates: {
      plugins: 0,
      themes: 0,
      wordpress: 0,
      details: []
    },
    wordfenceStats: { totalAttacks: 2150, lastScan: '2026-09-17 03:00:00', rulesOk: true },
    performanceInfo: { cachePlugin: 'LiteSpeed Cache', cacheEnabled: true, siteSizeGb: 0.38, diskFreeGb: 0.12 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    clientId: 5,
    name: 'dagda.com.py (Dominio)',
    category: 'dominio',
    provider: 'nic.py',
    serviceGroup: 'Plataforma Dagda',
    type: 'sistema',
    url: 'https://nic.py',
    status: 'online',
    billing: {
      responsibility: 'tc_agencia',
      cycle: 'annual',
      cost: 150000,
      currency: 'PYG',
      renewalDate: '2026-12-05',
      notes: 'Renovación gestionada por Impulsos Digitales (TC Rodney)'
    },
    relationships: [
      { targetId: 501, targetName: 'Hosting & DNS cPanel (Hosting Paraguay)', type: 'points_to' }
    ],
    roadmapNotes: 'Dominio primario .com.py registrado en nic.py',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 501,
    clientId: 5,
    name: 'Hosting & DNS cPanel',
    category: 'hosting',
    provider: 'Hosting Paraguay',
    serviceGroup: 'Plataforma Dagda',
    type: 'sistema',
    url: 'https://cpanel.dagda.com.py:2083',
    status: 'online',
    billing: {
      responsibility: 'tc_cliente',
      cycle: 'annual',
      cost: 450000,
      currency: 'PYG',
      renewalDate: '2027-01-15',
      notes: 'Plan compartido cPanel. Se debita de la TC del cliente.'
    },
    relationships: [
      { targetId: 502, targetName: 'Correo Corporativo (Microsoft 365)', type: 'hosts' },
      { targetId: 506, targetName: 'Web App & Panel Admin (Angular)', type: 'hosts' }
    ],
    roadmapNotes: 'DNS primario y hosting web. Aloja temporalmente frontend Angular.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 502,
    clientId: 5,
    name: 'Correo Corporativo (Microsoft 365)',
    category: 'correo',
    provider: 'Microsoft 365',
    serviceGroup: 'Sistemas Empresariales',
    type: 'sistema',
    url: 'https://outlook.office.com',
    status: 'online',
    billing: {
      responsibility: 'tc_cliente',
      cycle: 'monthly',
      cost: 24,
      currency: 'USD',
      notes: '4 casillas M365 Business Basic (USD 6/mes c/u). Cobra con TC del cliente.'
    },
    relationships: [
      { targetId: 501, targetName: 'Hosting & DNS cPanel (Hosting Paraguay)', type: 'depends_on' }
    ],
    roadmapNotes: 'Registros MX, SPF y DKIM vinculados a Hosting Paraguay.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 503,
    clientId: 5,
    name: 'Office 365 Personal / Familiar',
    category: 'licencia',
    provider: 'Microsoft',
    serviceGroup: 'Sistemas Empresariales',
    type: 'sistema',
    url: 'https://account.microsoft.com',
    status: 'warning',
    billing: {
      responsibility: 'tc_cliente',
      cycle: 'annual',
      cost: 99,
      currency: 'USD',
      notes: 'Suscripción personal/familiar contratada por el cliente.'
    },
    relationships: [
      { targetName: 'Infraestructura General', type: 'unlinked' }
    ],
    roadmapNotes: '⚠️ Mal licenciada: Plan familiar usado en empresa. Se debe proponer migración formal a M365 Business Standard.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 504,
    clientId: 5,
    name: 'Backend API & Base de Datos (Render Postgres)',
    category: 'servidor_bd',
    provider: 'Render',
    serviceGroup: 'Plataforma Dagda',
    type: 'sistema',
    url: 'https://api.dagda.com.py',
    status: 'online',
    billing: {
      responsibility: 'tc_agencia',
      cycle: 'monthly',
      cost: 15,
      currency: 'USD',
      notes: '⚠️ COBRANDO EN TC RODNEY (AGENCIA). Acción requerida: Cambiar método de pago a la TC del cliente.'
    },
    relationships: [
      { targetId: 505, targetName: 'App Móvil Dagda (Android & iOS)', type: 'connects_to' },
      { targetId: 506, targetName: 'Web App & Panel Admin (Angular)', type: 'connects_to' }
    ],
    roadmapNotes: 'Node.js Web Service + Managed Postgres en Render. Prioridad operativa: transferir facturación a tarjeta del cliente.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 505,
    clientId: 5,
    name: 'App Móvil Dagda (Android & iOS)',
    category: 'app_movil',
    provider: 'Google Play & App Store',
    serviceGroup: 'Plataforma Dagda',
    type: 'sistema',
    url: 'https://play.google.com/store/apps',
    status: 'online',
    billing: {
      responsibility: 'incluido',
      cycle: 'free',
      notes: 'Publicada bajo cuenta de desarrollador de la agencia.'
    },
    relationships: [
      { targetId: 504, targetName: 'Backend API & Base de Datos (Render Postgres)', type: 'depends_on' }
    ],
    roadmapNotes: 'App móvil nativa para pedidos y clientes. Consume la API de Render.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 506,
    clientId: 5,
    name: 'Web App & Panel Admin (Angular)',
    category: 'web_app',
    provider: 'Hosting Paraguay / Angular',
    serviceGroup: 'Plataforma Dagda',
    type: 'sistema',
    url: 'https://app.dagda.com.py',
    status: 'online',
    billing: {
      responsibility: 'incluido',
      cycle: 'free',
      notes: 'Alojada dentro del hosting cPanel de Hosting Paraguay.'
    },
    relationships: [
      { targetId: 504, targetName: 'Backend API & Base de Datos (Render Postgres)', type: 'depends_on' },
      { targetId: 501, targetName: 'Hosting & DNS cPanel (Hosting Paraguay)', type: 'depends_on' }
    ],
    roadmapNotes: '🚀 Roadmap de Modernización: Webapp Angular en cPanel. Planificado migrar a React (Next.js) y desplegar en Vercel para unificar arquitectura.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    clientId: 6,
    name: 'GeneSur',
    type: 'wordpress',
    url: 'https://genesur.com.py',
    token: process.env.WF_REPORT_TOKEN || '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f',
    diskAllocatedGb: 1.46,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 290,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 96 * 3600 * 1000),
    wpVersion: '6.7.1',
    phpVersion: '8.2.20',
    sslDaysLeft: 95,
    siteHealthScore: { status: 'good', good: 16, recommended: 2, critical: 0 },
    pendingUpdates: { plugins: 0, themes: 0, wordpress: 0, details: [] },
    wordfenceStats: { totalAttacks: 430, rulesOk: true },
    performanceInfo: { siteSizeGb: 0.92, diskFreeGb: 0.54 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    clientId: 7,
    name: 'Navíos Argentina',
    type: 'sistema',
    url: 'https://naviosargentina.com',
    token: '',
    diskAllocatedGb: 0,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 190,
    lastCheckedAt: new Date(),
    lastBackupAt: null,
    wpVersion: null,
    phpVersion: null,
    siteHealthScore: null,
    pendingUpdates: null,
    wordfenceStats: null,
    performanceInfo: null,
    sslDaysLeft: 110,
    metadata: { notes: 'Webapp logística en AWS' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    clientId: 8,
    name: 'Synexa',
    type: 'vercel',
    url: 'https://synexa.com.py',
    token: '',
    diskAllocatedGb: 0.524,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 95,
    lastCheckedAt: new Date(),
    lastBackupAt: null,
    wpVersion: null,
    phpVersion: null,
    siteHealthScore: null,
    pendingUpdates: null,
    wordfenceStats: null,
    performanceInfo: null,
    sslDaysLeft: 60,
    metadata: { vercelProjectId: 'prj_synexa_landing', gitRepo: 'github.com/impulsosdigitales/synexa-web' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 9,
    clientId: 9,
    name: 'Misa Guarani',
    type: 'wordpress',
    url: 'https://misaguarani.com',
    token: process.env.WF_REPORT_TOKEN || '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f',
    diskAllocatedGb: 4.0,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 340,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 120 * 3600 * 1000),
    wpVersion: '6.7.1',
    phpVersion: '8.2.20',
    sslDaysLeft: 35,
    siteHealthScore: { status: 'good', good: 15, recommended: 1, critical: 0 },
    pendingUpdates: { plugins: 0, themes: 0, wordpress: 0, details: [] },
    wordfenceStats: { totalAttacks: 780, rulesOk: true },
    performanceInfo: { siteSizeGb: 2.7, diskFreeGb: 1.3 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 10,
    clientId: 10,
    name: 'My Life',
    type: 'wordpress',
    url: 'https://mylife.com.py',
    token: process.env.WF_REPORT_TOKEN || '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f',
    diskAllocatedGb: 10.49,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 410,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 30 * 3600 * 1000),
    wpVersion: '6.7.1',
    phpVersion: '8.1.30',
    sslDaysLeft: 78,
    siteHealthScore: { status: 'good', good: 17, recommended: 2, critical: 0 },
    pendingUpdates: {
      plugins: 0,
      themes: 0,
      wordpress: 0,
      details: []
    },
    wordfenceStats: { totalAttacks: 3120, lastScan: '2026-09-19 02:00:00', rulesOk: true },
    performanceInfo: { cachePlugin: 'WP Rocket', cacheEnabled: true, siteSizeGb: 6.2, diskFreeGb: 4.29 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const INITIAL_SITES: Array<Site> = RAW_INITIAL_SITES.map(seedSite);

const INITIAL_TEMPLATES: Array<ConfigTemplate> = [
  {
    id: 1,
    name: 'Wordfence: Reglas Estándar Impulsos Digitales',
    category: 'security',
    description: 'Bloqueo estricto de fuerza bruta, bloqueo de nombres comunes (admin, test), alertas a telegram',
    configType: 'wp_options',
    payload: {
      loginSec_maxFailures: 5,
      loginSec_maxForgotPassFailures: 3,
      loginSec_countTime: 1200,
      loginSec_lockoutDuration: 7200,
      loginSec_userBlacklist: 'admin, administrator, root, test, user, demo',
      liveTrafficEnabled: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'LiteSpeed Cache: Perfil Recomendado para Pymes',
    category: 'cache',
    description: 'Caché de páginas, minificación CSS/JS diferida, compresión WebP automática',
    configType: 'wp_options',
    payload: {
      cache_page: true,
      cache_priv: false,
      css_minify: true,
      js_minify: true,
      optm_webp: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'Escritorio Limpio: Ocultar Widgets Innecesarios',
    category: 'widgets',
    description: 'Remueve Bienvenida, Noticias de WordPress, Borrador rápido y Actividad de terceros',
    configType: 'wp_options',
    payload: {
      hidden_widgets: ['dashboard_quick_draft', 'dashboard_primary', 'dashboard_activity', 'welcome_panel']
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: 'White-Label Branding: Impulsos Digitales',
    category: 'branding',
    description: 'Personaliza pantalla de login con logo y fondo corporativo, añade créditos en footer',
    configType: 'wp_options',
    payload: {
      logo_url: 'https://admin.impulsosdigitales.com.py/wp-content/uploads/logo-idpy.png',
      bg_color: '#0f172a',
      footer_text: 'Desarrollado y Gestionado por Impulsos Digitales'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const INITIAL_SERVICE_GROUPS: Array<ServiceGroup> = [
  {
    id: 1,
    clientId: 5,
    name: 'Plataforma Dagda',
    description: 'Ecosistema central: Web Angular, App Móvil (Android & iOS), Backend API y PostgreSQL en Render',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    clientId: 5,
    name: 'Sistemas Empresariales',
    description: 'Correo corporativo Microsoft 365 y licenciamiento ofimático',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    clientId: 1,
    name: 'Plataforma Central & SentinelIDPY',
    description: 'Agencia matriz y panel administrativo central',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    clientId: 2,
    name: 'Sitio Web Corporativo',
    description: 'Web institucional y portal de clientes',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const INITIAL_PROJECTS: Array<Project> = [
  {
    id: 1,
    clientId: 14, // Repar
    name: 'Sitio Web Corporativo Repar',
    category: 'web_corp',
    status: 'in_progress',
    waitingOn: 'agency',
    budget: 2500000,
    currency: 'PYG',
    advancePaid: 1250000,
    targetDeliveryDate: '2026-10-15',
    notes: 'Desarrollo en WordPress + diseño responsive y catálogo de servicios técnicos.',
    driveUrl: 'https://drive.google.com/drive/folders/repar-2026/web',
    assignedRole: 'martin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    clientId: 14, // Repar
    name: 'Hardening & Auditoría de Ciberseguridad',
    category: 'security',
    status: 'pending',
    waitingOn: 'client',
    budget: 1800000,
    currency: 'PYG',
    advancePaid: 0,
    targetDeliveryDate: '2026-11-01',
    notes: 'Esperando accesos a cPanel y lista de usuarios para iniciar auditoría y bastionado.',
    driveUrl: 'https://drive.google.com/drive/folders/repar-2026/seguridad',
    assignedRole: 'martin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    clientId: 5, // Dagda
    name: 'Frontend Web v2 & App Redesign',
    category: 'mobile_app',
    status: 'pending',
    waitingOn: 'agency',
    budget: 3500000,
    currency: 'PYG',
    advancePaid: 1000000,
    targetDeliveryDate: '2026-10-30',
    notes: 'Rediseño de interfaz y migración de componentes hacia nueva API en Render.',
    driveUrl: 'https://drive.google.com/drive/folders/dagda-app/v2',
    assignedRole: 'martin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    clientId: 6, // GeneSur
    name: 'Mantenimiento & Auditoría Anual 2026',
    category: 'web_corp',
    status: 'in_progress',
    waitingOn: 'client',
    budget: 2500000,
    currency: 'PYG',
    advancePaid: 1250000,
    targetDeliveryDate: '2026-09-30',
    notes: 'Esperando confirmación de contenidos actualizados de catálogo ganadero.',
    driveUrl: 'https://drive.google.com/drive/folders/genesur/auditoria',
    assignedRole: 'ana',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const INITIAL_PAYMENTS: Array<Payment> = [
  { id: 1, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-01-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento preventivo Plan Elite Enero 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-001', status: 'completed', notes: 'Transferencia Itaú', createdAt: new Date(), updatedAt: new Date() },
  { id: 2, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-01-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento mensual CGA Corporativo', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-002', status: 'completed', notes: 'Facturado con IVA', createdAt: new Date(), updatedAt: new Date() },
  { id: 3, clientId: 5, projectId: null, amount: 600000, currency: 'PYG', date: '2026-01-28', concept: 'consultoria', description: 'Soporte y configuración Cloud Render/Postgres', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-003', status: 'completed', notes: 'Consultoría técnica', createdAt: new Date(), updatedAt: new Date() },
  { id: 4, clientId: 14, projectId: 1, amount: 1250000, currency: 'PYG', date: '2026-02-10', concept: 'anticipo_proyecto', description: 'Anticipo 50% Sitio Web Corporativo Repar', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-004', status: 'completed', notes: 'Inicio de diseño UI/UX', createdAt: new Date(), updatedAt: new Date() },
  { id: 5, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-02-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Febrero 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-005', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 6, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-02-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Febrero 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-006', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 7, clientId: 5, projectId: 3, amount: 2980000, currency: 'PYG', date: '2026-02-27', concept: 'anticipo_proyecto', description: 'Desarrollo Frontend Web v2 y sincronización API', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-007', status: 'completed', notes: 'Desarrollo en curso', createdAt: new Date(), updatedAt: new Date() },
  { id: 8, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-03-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Marzo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-008', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 9, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-03-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Marzo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-009', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 10, clientId: 10, projectId: null, amount: 650000, currency: 'PYG', date: '2026-04-12', concept: 'renovacion_anual', description: 'Renovación anual de hosting cPanel 15GB', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-010', status: 'completed', notes: 'Vence abril 2027', createdAt: new Date(), updatedAt: new Date() },
  { id: 11, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-04-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Abril 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-011', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 12, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-04-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Abril 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-012', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 13, clientId: 8, projectId: null, amount: 580000, currency: 'PYG', date: '2026-04-26', concept: 'consultoria', description: 'Soporte y configuración Microsoft 365', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-013', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 14, clientId: 13, projectId: null, amount: 350000, currency: 'PYG', date: '2026-05-10', concept: 'renovacion_anual', description: 'Renovación anual hosting cPanel 5GB Mercopar', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-014', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 15, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-05-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Mayo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-015', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 16, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-05-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Mayo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-016', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 17, clientId: 11, projectId: null, amount: 350000, currency: 'PYG', date: '2026-06-12', concept: 'renovacion_anual', description: 'Renovación anual hosting cPanel CNA', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-017', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 18, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-06-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Junio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-018', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 19, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-06-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Junio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-019', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 20, clientId: 9, projectId: null, amount: 480000, currency: 'PYG', date: '2026-07-15', concept: 'renovacion_anual', description: 'Mantenimiento Plan Pro Anual Misa Guaraní', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-020', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 21, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-07-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Julio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-021', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 22, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-07-25', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Julio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-022', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 23, clientId: 6, projectId: 4, amount: 1250000, currency: 'PYG', date: '2026-08-10', concept: 'anticipo_proyecto', description: 'Anticipo Mantenimiento & Auditoría Anual 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-023', status: 'completed', notes: 'Auditoría SEO y catálogo', createdAt: new Date(), updatedAt: new Date() },
  { id: 24, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-08-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Agosto 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-024', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 25, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-08-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Agosto 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-025', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() },
  { id: 26, clientId: 8, projectId: null, amount: 850000, currency: 'PYG', date: '2026-08-26', concept: 'consultoria', description: 'Servicios de consultoría TI y optimización', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-026', status: 'completed', notes: '', createdAt: new Date(), updatedAt: new Date() }
];

const DEFAULT_FINANCIAL_SETTINGS = {
  currentLadderStep: 1, // Escalón 1 (₲600.000)
  targetLadderStep: 2, // Escalón 2 (₲1.000.000)
  targetSalary: 3500000, // Meta de escala: ₲3.500.000 - ₲5.000.000
  distributionRules: {
    iva: 0.10, // 10%
    opex: 0.15, // 15%
    reserve: 0.05, // 5%
    reinvestment: 0.10, // 10%
    salaryAndCushion: 0.60, // 60%
  },
  salaryLadder: [
    {
      step: 1,
      name: 'Escalón 1',
      withdrawableSalary: 600000,
      avgRequiredBilling: 1100000,
      minCushion: 2000000,
      downgradeRule: 'Piso base (no baja más)',
      active: true,
    },
    {
      step: 2,
      name: 'Escalón 2',
      withdrawableSalary: 1000000,
      avgRequiredBilling: 1700000,
      minCushion: 2000000,
      downgradeRule: 'Si Colchón < ₲1.000.000 tras 3 meses bajos → Vuelve a ₲600.000',
      active: false,
    },
    {
      step: 3,
      name: 'Escalón 3',
      withdrawableSalary: 1500000,
      avgRequiredBilling: 2500000,
      minCushion: 4500000,
      downgradeRule: 'Si Colchón < ₲2.250.000 tras 3 meses bajos → Vuelve a ₲1.000.000',
      active: false,
    },
    {
      step: 4,
      name: 'Escalón 4',
      withdrawableSalary: 2000000,
      avgRequiredBilling: 3350000,
      minCushion: 6000000,
      downgradeRule: 'Si Colchón < ₲3.000.000 tras 3 meses bajos → Vuelve a ₲1.500.000',
      active: false,
    }
  ]
};

// Fallback in-memory stores (in case DB is not yet migrated or offline)
let memoryClients = [...INITIAL_CLIENTS];
let memorySites = [...INITIAL_SITES];
const memoryTemplates = [...INITIAL_TEMPLATES];
let memoryServiceGroups = [...INITIAL_SERVICE_GROUPS];
let memoryProjects = [...INITIAL_PROJECTS];
let memoryPayments = [...INITIAL_PAYMENTS];
let memoryFinancialSettings = { ...DEFAULT_FINANCIAL_SETTINGS };

export const dataService = {
  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    if (db) {
      try {
        const rows = await db.select().from(schema.clients);
        if (rows.length > 0) return rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryClients;
  },

  async getClientById(id: number): Promise<Client | undefined> {
    if (db) {
      try {
        const [row] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
        if (row) return row;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryClients.find((c) => c.id === id);
  },

  async createClient(data: NewClient): Promise<Client> {
    if (db) {
      try {
        const [created] = await db.insert(schema.clients).values(data).returning();
        return created;
      } catch (err) {
        console.warn('DB insert failed, using memory store:', err);
      }
    }
    const newClient: Client = {
      id: Math.max(0, ...memoryClients.map((c) => c.id)) + 1,
      name: data.name,
      legalName: data.legalName || null,
      ruc: data.ruc || null,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
      status: data.status || 'active',
      acquisitionChannel: data.acquisitionChannel || null,
      driveFolderUrl: data.driveFolderUrl || null,
      timeline: data.timeline || [],
      infrastructure: data.infrastructure || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryClients.push(newClient);
    return newClient;
  },

  async updateClient(id: number, data: Partial<Client>): Promise<Client | null> {
    if (db) {
      try {
        const [updated] = await db.update(schema.clients)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.clients.id, id))
          .returning();
        return updated || null;
      } catch (err) {
        console.warn('DB update failed, using memory store:', err);
      }
    }
    const index = memoryClients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    memoryClients[index] = { ...memoryClients[index], ...data, updatedAt: new Date() };
    return memoryClients[index];
  },

  async deleteClient(id: number): Promise<boolean> {
    if (db) {
      try {
        await db.delete(schema.clients).where(eq(schema.clients.id, id));
        return true;
      } catch (err) {
        console.warn('DB delete failed, using memory store:', err);
      }
    }
    const initialLen = memoryClients.length;
    memoryClients = memoryClients.filter((c) => c.id !== id);
    memorySites = memorySites.filter((s) => s.clientId !== id);
    return memoryClients.length < initialLen;
  },

  async addClientTimelineEvent(clientId: number, event: Omit<ClientTimelineEvent, 'id'>): Promise<Client | null> {
    const client = await this.getClientById(clientId);
    if (!client) return null;

    const newEvent: ClientTimelineEvent = {
      id: `t-${clientId}-${Date.now()}`,
      ...event
    };

    const currentTimeline = Array.isArray(client.timeline) ? client.timeline : [];
    const updatedTimeline = [...currentTimeline, newEvent];
    return this.updateClient(clientId, { timeline: updatedTimeline });
  },

  // --- SITES ---
  async getSites(filters?: { clientId?: number; type?: string; includeArchived?: boolean }): Promise<Site[]> {
    let result = memorySites;
    if (db) {
      try {
        const rows = await db.select().from(schema.sites);
        if (rows.length > 0) result = rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }

    if (!filters?.includeArchived) {
      result = result.filter((s) => s.status !== 'archived');
    }

    if (filters?.clientId) {
      result = result.filter((s) => s.clientId === filters.clientId);
    }
    if (filters?.type && filters.type !== 'all') {
      result = result.filter((s) => s.type === filters.type);
    }
    return result;
  },

  async getSiteById(id: number): Promise<Site | undefined> {
    if (db) {
      try {
        const [row] = await db.select().from(schema.sites).where(eq(schema.sites.id, id));
        if (row) return row;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memorySites.find((s) => s.id === id);
  },

  async createSite(data: NewSite): Promise<Site> {
    if (db) {
      try {
        const [created] = await db.insert(schema.sites).values(data).returning();
        return created;
      } catch (err) {
        console.warn('DB insert failed, using memory store:', err);
      }
    }
    const newSite: Site = {
      id: Math.max(0, ...memorySites.map((s) => s.id)) + 1,
      clientId: data.clientId || null,
      name: data.name,
      type: data.type || 'wordpress',
      url: data.url,
      token: data.token || null,
      diskAllocatedGb: data.diskAllocatedGb || null,
      status: data.status || 'unknown',
      lastStatusCode: data.lastStatusCode || null,
      lastResponseTimeMs: data.lastResponseTimeMs || null,
      lastCheckedAt: new Date(),
      lastBackupAt: null,
      wpVersion: data.wpVersion || null,
      phpVersion: data.phpVersion || null,
      sslDaysLeft: data.sslDaysLeft || null,
      siteHealthScore: data.siteHealthScore || null,
      pendingUpdates: data.pendingUpdates || { plugins: 0, themes: 0, wordpress: 0 },
      wordfenceStats: data.wordfenceStats || null,
      performanceInfo: data.performanceInfo || null,
      metadata: data.metadata || null,
      category: data.category || (data.type === 'wordpress' ? 'web_wordpress' : data.type === 'vercel' ? 'vercel' : 'web_app'),
      provider: data.provider || null,
      billing: data.billing || null,
      relationships: data.relationships || null,
      roadmapNotes: data.roadmapNotes || null,
      serviceGroup: data.serviceGroup || 'General',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memorySites.push(newSite);
    return newSite;
  },

  async updateSite(id: number, data: Partial<Site>): Promise<Site | null> {
    if (db) {
      try {
        const [updated] = await db.update(schema.sites)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.sites.id, id))
          .returning();
        return updated || null;
      } catch (err) {
        console.warn('DB update failed, using memory store:', err);
      }
    }
    const index = memorySites.findIndex((s) => s.id === id);
    if (index === -1) return null;
    memorySites[index] = { ...memorySites[index], ...data, updatedAt: new Date() };
    return memorySites[index];
  },

  async deleteSite(id: number): Promise<boolean> {
    // Soft delete: Mark site as 'archived' so it is excluded from active queries
    const updated = await this.updateSite(id, { status: 'archived' });
    return !!updated;
  },

  // --- TEMPLATES ---
  async getTemplates(): Promise<ConfigTemplate[]> {
    if (db) {
      try {
        const rows = await db.select().from(schema.configTemplates);
        if (rows.length > 0) return rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryTemplates;
  },

  async getTemplateById(id: number): Promise<ConfigTemplate | undefined> {
    if (db) {
      try {
        const [row] = await db.select().from(schema.configTemplates).where(eq(schema.configTemplates.id, id));
        if (row) return row;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryTemplates.find((t) => t.id === id);
  },

  // --- ACTIVITY LOGS ---
  async logActivity(siteId: number | null, action: string, status: 'success' | 'failed' | 'running', details?: unknown) {
    if (db) {
      try {
        await db.insert(schema.activityLogs).values({ siteId, action, status, details });
      } catch (err) {
        console.warn('Activity log failed:', err);
      }
    }
  },

  // --- MODERN SERVICE ALIASES ---
  async getServices(filters?: { clientId?: number; type?: string; includeArchived?: boolean }): Promise<Service[]> {
    return this.getSites(filters);
  },
  async getServiceById(id: number): Promise<Service | undefined> {
    return this.getSiteById(id);
  },
  async createService(data: NewService): Promise<Service> {
    return this.createSite(data);
  },
  async updateService(id: number, data: Partial<Service>): Promise<Service | null> {
    return this.updateSite(id, data);
  },
  async deleteService(id: number): Promise<boolean> {
    return this.deleteSite(id);
  },

  // --- SERVICE GROUPS (Sistemas por Cliente) ---
  async getServiceGroups(clientId?: number): Promise<ServiceGroup[]> {
    if (db) {
      try {
        if (clientId) {
          const rows = await db.select().from(schema.serviceGroups).where(eq(schema.serviceGroups.clientId, clientId));
          if (rows.length > 0) return rows;
        } else {
          const rows = await db.select().from(schema.serviceGroups);
          if (rows.length > 0) return rows;
        }
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    if (clientId) {
      return memoryServiceGroups.filter((g) => g.clientId === clientId);
    }
    return memoryServiceGroups;
  },

  async getServiceGroupById(id: number): Promise<ServiceGroup | undefined> {
    if (db) {
      try {
        const [row] = await db.select().from(schema.serviceGroups).where(eq(schema.serviceGroups.id, id));
        if (row) return row;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryServiceGroups.find((g) => g.id === id);
  },

  async createServiceGroup(data: NewServiceGroup): Promise<ServiceGroup> {
    if (db) {
      try {
        const [created] = await db.insert(schema.serviceGroups).values(data).returning();
        return created;
      } catch (err) {
        console.warn('DB insert failed, using memory store:', err);
      }
    }
    const newGroup: ServiceGroup = {
      id: Math.max(0, ...memoryServiceGroups.map((g) => g.id)) + 1,
      clientId: data.clientId,
      name: data.name,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryServiceGroups.push(newGroup);
    return newGroup;
  },

  async updateServiceGroup(id: number, data: Partial<ServiceGroup>): Promise<ServiceGroup | null> {
    const existing = await this.getServiceGroupById(id);
    if (!existing) return null;
    const oldName = existing.name;

    if (db) {
      try {
        const [updated] = await db.update(schema.serviceGroups)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.serviceGroups.id, id))
          .returning();
        if (updated && data.name && data.name !== oldName) {
          // Cascade update services with matching group
          await db.update(schema.sites)
            .set({ serviceGroup: data.name })
            .where(eq(schema.sites.clientId, existing.clientId));
        }
        if (updated) return updated;
      } catch (err) {
        console.warn('DB update failed, using memory store:', err);
      }
    }

    const index = memoryServiceGroups.findIndex((g) => g.id === id);
    if (index === -1) return null;
    memoryServiceGroups[index] = { ...memoryServiceGroups[index], ...data, updatedAt: new Date() };

    // Cascade update in memorySites
    if (data.name && data.name !== oldName) {
      memorySites = memorySites.map((s) => {
        if (s.clientId === existing.clientId && s.serviceGroup === oldName) {
          return { ...s, serviceGroup: data.name! };
        }
        return s;
      });
    }

    return memoryServiceGroups[index];
  },

  async deleteServiceGroup(id: number): Promise<boolean> {
    const existing = await this.getServiceGroupById(id);
    if (!existing) return false;

    if (db) {
      try {
        await db.delete(schema.serviceGroups).where(eq(schema.serviceGroups.id, id));
      } catch (err) {
        console.warn('DB delete failed, using memory store:', err);
      }
    }

    // Reassign affected services to 'General'
    memorySites = memorySites.map((s) => {
      if (s.clientId === existing.clientId && s.serviceGroup === existing.name) {
        return { ...s, serviceGroup: 'General' };
      }
      return s;
    });

    const initialLen = memoryServiceGroups.length;
    memoryServiceGroups = memoryServiceGroups.filter((g) => g.id !== id);
    return memoryServiceGroups.length < initialLen;
  },

  // --- PROJECTS ---
  async getProjects(filters?: { clientId?: number; status?: string }): Promise<Project[]> {
    let result = memoryProjects;
    if (db) {
      try {
        const rows = await db.select().from(schema.projects);
        if (rows.length > 0) result = rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    if (filters?.clientId) {
      result = result.filter((p) => p.clientId === filters.clientId);
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    return result;
  },

  async getProjectById(id: number): Promise<Project | undefined> {
    if (db) {
      try {
        const [row] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
        if (row) return row;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryProjects.find((p) => p.id === id);
  },

  async createProject(data: NewProject): Promise<Project> {
    if (db) {
      try {
        const [created] = await db.insert(schema.projects).values(data).returning();
        return created;
      } catch (err) {
        console.warn('DB insert failed, using memory store:', err);
      }
    }
    const newProj: Project = {
      id: Math.max(0, ...memoryProjects.map((p) => p.id)) + 1,
      clientId: data.clientId || null,
      name: data.name,
      category: data.category || 'web_corp',
      status: data.status || 'pending',
      waitingOn: data.waitingOn || 'agency',
      budget: data.budget ?? 0,
      currency: data.currency || 'PYG',
      advancePaid: data.advancePaid ?? 0,
      targetDeliveryDate: data.targetDeliveryDate || null,
      notes: data.notes || null,
      driveUrl: data.driveUrl || null,
      assignedRole: data.assignedRole || 'martin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryProjects.push(newProj);
    return newProj;
  },

  async updateProject(id: number, data: Partial<Project>): Promise<Project | null> {
    if (db) {
      try {
        const [updated] = await db.update(schema.projects)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.projects.id, id))
          .returning();
        return updated || null;
      } catch (err) {
        console.warn('DB update failed, using memory store:', err);
      }
    }
    const index = memoryProjects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    memoryProjects[index] = { ...memoryProjects[index], ...data, updatedAt: new Date() };
    return memoryProjects[index];
  },

  async deleteProject(id: number): Promise<boolean> {
    if (db) {
      try {
        await db.delete(schema.projects).where(eq(schema.projects.id, id));
        return true;
      } catch (err) {
        console.warn('DB delete failed, using memory store:', err);
      }
    }
    const initialLen = memoryProjects.length;
    memoryProjects = memoryProjects.filter((p) => p.id !== id);
    return memoryProjects.length < initialLen;
  },

  // --- PAYMENTS & FINANCES ---
  async getPayments(filters?: { clientId?: number; year?: string; month?: string; status?: string }): Promise<Payment[]> {
    let result = memoryPayments;
    if (db) {
      try {
        const rows = await db.select().from(schema.payments);
        if (rows.length > 0) result = rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    if (filters?.clientId) {
      result = result.filter((p) => p.clientId === filters.clientId);
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.year) {
      result = result.filter((p) => p.date.startsWith(filters.year!));
    }
    if (filters?.month) {
      result = result.filter((p) => p.date.includes(`-${filters.month!.padStart(2, '0')}-`));
    }
    // Sort desc by date
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getPaymentById(id: number): Promise<Payment | undefined> {
    if (db) {
      try {
        const [row] = await db.select().from(schema.payments).where(eq(schema.payments.id, id));
        if (row) return row;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryPayments.find((p) => p.id === id);
  },

  async createPayment(data: NewPayment): Promise<Payment> {
    let created: Payment | null = null;
    if (db) {
      try {
        const [row] = await db.insert(schema.payments).values(data).returning();
        created = row;
      } catch (err) {
        console.warn('DB insert failed, using memory store:', err);
      }
    }

    if (!created) {
      created = {
        id: Math.max(0, ...memoryPayments.map((p) => p.id)) + 1,
        clientId: data.clientId || null,
        projectId: data.projectId || null,
        amount: data.amount,
        currency: data.currency || 'PYG',
        date: data.date,
        concept: data.concept,
        description: data.description || null,
        paymentMethod: data.paymentMethod || 'transferencia',
        receiptNumber: data.receiptNumber || null,
        status: data.status || 'completed',
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryPayments.unshift(created);
    } else {
      memoryPayments.unshift(created);
    }

    // Auto-update project advance if associated with a project
    if (data.projectId) {
      const proj = await this.getProjectById(data.projectId);
      if (proj) {
        const currentAdvance = proj.advancePaid || 0;
        await this.updateProject(data.projectId, {
          advancePaid: currentAdvance + data.amount,
          status: proj.status === 'pending' ? 'in_progress' : proj.status
        });
      }
    }

    return created;
  },

  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment | null> {
    if (db) {
      try {
        const [updated] = await db.update(schema.payments)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.payments.id, id))
          .returning();
        return updated || null;
      } catch (err) {
        console.warn('DB update failed, using memory store:', err);
      }
    }
    const index = memoryPayments.findIndex((p) => p.id === id);
    if (index === -1) return null;
    memoryPayments[index] = { ...memoryPayments[index], ...data, updatedAt: new Date() };
    return memoryPayments[index];
  },

  async deletePayment(id: number): Promise<boolean> {
    if (db) {
      try {
        await db.delete(schema.payments).where(eq(schema.payments.id, id));
        return true;
      } catch (err) {
        console.warn('DB delete failed, using memory store:', err);
      }
    }
    const initialLen = memoryPayments.length;
    memoryPayments = memoryPayments.filter((p) => p.id !== id);
    return memoryPayments.length < initialLen;
  },

  async getFinancialSettings() {
    if (db) {
      try {
        const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'salary_ladder_config'));
        if (row && row.value) return row.value as typeof DEFAULT_FINANCIAL_SETTINGS;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryFinancialSettings;
  },

  async updateFinancialSettings(settings: Partial<typeof DEFAULT_FINANCIAL_SETTINGS>) {
    const updated = { ...memoryFinancialSettings, ...settings };
    if (db) {
      try {
        await db.insert(schema.appSettings)
          .values({ key: 'salary_ladder_config', value: updated })
          .onConflictDoUpdate({
            target: schema.appSettings.key,
            set: { value: updated, updatedAt: new Date() }
          });
      } catch (err) {
        console.warn('DB insert/update failed, using memory store:', err);
      }
    }
    memoryFinancialSettings = updated;
    return memoryFinancialSettings;
  },

  isDatabaseConnected(): boolean {
    return Boolean(db);
  }
};

