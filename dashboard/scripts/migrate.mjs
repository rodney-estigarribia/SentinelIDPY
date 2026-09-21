// Database migration and synchronization script for Vercel build step
import { neon } from '@neondatabase/serverless';

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile('.env.local');
  }
} catch {
  // .env.local does not exist or already loaded
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.log('ℹ️ [migrate] No DATABASE_URL or POSTGRES_URL found. Skipping database migration in this environment.');
  process.exit(0);
}

const INITIAL_CLIENTS = [
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
      { id: 't-1-1', year: '2022', title: 'Fundación de Impulsos Digitales', description: 'Inicio de operaciones de consultoría cloud y desarrollo digital.', category: 'milestone', actor: 'rodney' },
      { id: 't-1-2', year: '2026', title: 'Despliegue Plataforma SentinelIDPY', description: 'Lanzamiento de plataforma centralizada de telemetría y operaciones.', category: 'milestone', actor: 'rodney' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2027-01-15', annualCost: 150000, currency: 'PYG', notes: 'Dominio institucional de la agencia' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Dedicated Reseller 50GB', annualCost: 1200000, currency: 'PYG', notes: 'Servidor cPanel principal de producción' },
      dns: { provider: 'Cloudflare', notes: 'DNS proxied con SSL universal y reglas de firewall' },
      email: { provider: 'Google Workspace', accountsCount: 5, annualCost: 360, currency: 'USD' }
    }
  },
  {
    id: 2,
    name: 'CGA Corporativo',
    legalName: 'CGA GROUP SA',
    ruc: '80092994-2',
    email: 'contacto@cgagroup.com.py',
    phone: '+595 981 123456',
    company: 'CGA Group S.A.',
    notes: 'Cliente corporativo principal - Plan Elite Mantenimiento',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cga-corporativo',
    timeline: [
      { id: 't-2-1', year: '2023', title: 'Desarrollo Web Corporativa', description: 'Lanzamiento del portal web principal en WordPress.', category: 'milestone', actor: 'rodney' },
      { id: 't-2-2', year: '2024', title: 'Plan Elite de Mantenimiento', description: 'Contratación de soporte técnico preventivo mensual.', category: 'upgrade', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-11-20', annualCost: 150000, currency: 'PYG', notes: 'Lo renueva Impulsos Digitales' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business 10GB', annualCost: 450000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Microsoft 365', accountsCount: 15, annualCost: 1080, currency: 'USD' }
    }
  },
  {
    id: 3,
    name: 'CGA Portal',
    legalName: 'CGA GROUP SA',
    ruc: '80092994-2',
    email: 'portal@cgagroup.com.py',
    phone: '+595 981 123456',
    company: 'CGA Group S.A.',
    notes: 'Portal secundario y recursos para colaboradores',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cga-portal',
    timeline: [
      { id: 't-3-1', year: '2024', title: 'Lanzamiento Portal Interno', description: 'Despliegue del portal de colaboradores conectado al hosting corporativo.', category: 'milestone', actor: 'martin' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py (subdominio portal.cga...)', renewer: 'agency', expiryDate: '2026-11-20', annualCost: 0, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Compartido con CGA Corp', annualCost: 0, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Microsoft 365 (incluido en Corp)', accountsCount: 0, annualCost: 0, currency: 'USD' }
    }
  },
  {
    id: 4,
    name: 'Cope Market Deli',
    legalName: 'Cope Market Deli',
    ruc: '80054321-9',
    email: 'contacto@copemarket.com.py',
    phone: '+595 981 654321',
    company: 'Cope Market Deli',
    notes: 'Cliente histórico con tienda online. Servicio dado de baja en 2026 por reestructuración del cliente.',
    status: 'churned',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cope-market-historico',
    timeline: [
      { id: 't-4-1', year: '2023', title: 'Desarrollo E-commerce WooCommerce', description: 'Implementación de catálogo digital y delivery.', category: 'milestone', actor: 'rodney' },
      { id: 't-4-2', year: '2024', title: 'Mantenimiento Preventivo y Promociones', description: 'Soporte y campañas digitales continuas.', category: 'note', actor: 'martin' },
      { id: 't-4-3', year: '2026', title: 'Baja del Servicio', description: 'El cliente reestructuró su modelo de venta presencial y suspendió la web.', category: 'churn', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-06-30', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Suspendido', annualCost: 0, currency: 'PYG' }
    }
  },
  {
    id: 5,
    name: 'Dagda',
    legalName: 'DAGDA S.A.',
    ruc: '80138071-5',
    email: 'soporte@dagda.com.py',
    phone: '+595 981 333444',
    company: 'Dagda S.A.',
    notes: 'Ecosistema tecnológico híbrido: Web WordPress institucional, backend FastAPI en Render y base PostgreSQL.',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/dagda-ecosistema',
    timeline: [
      { id: 't-5-1', year: '2024', title: 'Arquitectura Cloud e Inicio', description: 'Diseño de la infraestructura híbrida Web + Backend Render + App Móvil.', category: 'milestone', actor: 'rodney' },
      { id: 't-5-2', year: '2025', title: 'Despliegue de API y Base de Datos', description: 'Lanzamiento de endpoints en Render y cluster de base de datos.', category: 'upgrade', actor: 'martin' },
      { id: 't-5-3', year: '2026', title: 'Planificación de Frontend Web v2', description: 'Proyecto de modernización de UI y componentes en pipeline.', category: 'milestone', actor: 'martin' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-10-15', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel Web) + Render.com (Backend)', plan: 'Cloud Hybrid', annualCost: 650000, currency: 'PYG' },
      dns: { provider: 'Cloudflare' },
      email: { provider: 'Google Workspace', accountsCount: 10, annualCost: 720, currency: 'USD' }
    }
  },
  {
    id: 6,
    name: 'GeneSur',
    legalName: 'GENESUR S.A.',
    ruc: '80017259-0',
    email: 'info@genesur.com.py',
    phone: '+595 981 555666',
    company: 'GeneSur S.A.',
    notes: 'Cliente agroganadero clave - Plan Elite de Mantenimiento',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/genesur',
    timeline: [
      { id: 't-6-1', year: '2023', title: 'Desarrollo Portal Institucional', description: 'Sitio web WordPress con catálogo ganadero y fichas técnicas.', category: 'milestone', actor: 'rodney' },
      { id: 't-6-2', year: '2024', title: 'Plan Elite de Mantenimiento', description: 'Mantenimiento mensual preventivo, copias y seguridad.', category: 'upgrade', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-09-30', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business 10GB', annualCost: 450000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'cPanel Host', accountsCount: 12, annualCost: 0, currency: 'PYG' }
    }
  },
  {
    id: 7,
    name: 'Navíos Argentina',
    legalName: 'Navíos Argentina S.A.',
    ruc: '30-71000000-1',
    email: 'contacto@navios.com.py',
    phone: '+54 11 4000 1234',
    company: 'Navíos Logistics',
    notes: 'Operaciones fluviales y logística',
    status: 'active',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/navios-argentina',
    timeline: [
      { id: 't-7-1', year: '2024', title: 'Despliegue Portal Logístico', description: 'Sitio institucional corporativo internacional.', category: 'milestone', actor: 'martin' }
    ],
    infrastructure: {
      domain: { provider: 'NIC Argentina', renewer: 'client', expiryDate: '2026-12-01', annualCost: 12000, currency: 'ARS' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 10GB', annualCost: 450000, currency: 'PYG' },
      dns: { provider: 'Cloudflare' }
    }
  },
  {
    id: 8,
    name: 'Synexa',
    legalName: 'SYNEXA S.A.',
    ruc: '80138132-0',
    email: 'info@synexa.com.py',
    phone: '+595 21 600 700',
    company: 'Synexa S.A.',
    notes: 'Servicios financieros y consultoría',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/synexa',
    timeline: [
      { id: 't-8-1', year: '2024', title: 'Desarrollo Web Corporativa', description: 'Portal financiero institucional.', category: 'milestone', actor: 'rodney' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-11-10', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 350000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Microsoft 365', accountsCount: 8, annualCost: 576, currency: 'USD' }
    }
  },
  {
    id: 9,
    name: 'Misa Guaraní',
    legalName: 'MEAURIO MANCUELLO CLAUDIA LORENA',
    ruc: '5415611-4',
    email: 'contacto@misaguarani.com.py',
    phone: '+595 981 789456',
    company: 'Misa Guaraní',
    notes: 'Portal cultural y pastoral con Plan Pro',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/misa-guarani',
    timeline: [
      { id: 't-9-1', year: '2023', title: 'Creación Web Cultural', description: 'Desarrollo web y biblioteca multimedia.', category: 'milestone', actor: 'martin' },
      { id: 't-9-2', year: '2024', title: 'Plan Pro Anual', description: 'Mantenimiento preventivo anual ₲480.000/año.', category: 'upgrade', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-10-25', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 350000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' }
    }
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
      { id: 't-10-1', year: '2023', title: 'Desarrollo Web en WordPress', description: 'Plataforma con agenda y recursos descargables.', category: 'milestone', actor: 'martin' },
      { id: 't-10-2', year: '2026', title: 'Hosting renovado con la agencia', description: 'Renovación de hosting gestionada por nosotros (vencimiento abril).', category: 'upgrade', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-09-28', annualCost: 150000, currency: 'PYG', notes: 'Lo hace el cliente - Vence en septiembre' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 15GB', annualCost: 650000, currency: 'PYG', notes: 'Renueva con nosotros - Vence en abril' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Google Workspace', accountsCount: 8, annualCost: 576, currency: 'USD' }
    }
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
      { id: 't-11-1', year: '2024', title: 'Lanzamiento Web Institucional', description: 'Sitio web WordPress corporativo.', category: 'milestone', actor: 'martin' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-11-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 350000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' }
    }
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
      { id: 't-12-1', year: '2023', title: 'Desarrollo Web en WordPress', description: 'Sitio web institucional farmacéutico en WordPress.', category: 'milestone', actor: 'rodney' },
      { id: 't-12-2', year: '2024', title: 'Soporte y Actualizaciones', description: 'Mantenimiento técnico preventivo y seguridad.', category: 'note', actor: 'martin' },
      { id: 't-12-3', year: '2025', title: 'Migración Externa a Wix', description: 'El cliente decidió migrar su plataforma a Wix por autogestión; se finalizó el hosting WordPress.', category: 'migration', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-10-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Wix (Externo)', plan: 'Wix Premium', annualCost: 0, currency: 'USD' }
    }
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
      { id: 't-13-1', year: '2024', title: 'Desarrollo Web y Catálogo', description: 'Presencia corporativa y estructura de catálogo.', category: 'milestone', actor: 'martin' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-11-15', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 5GB', annualCost: 350000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' }
    }
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
      { id: 't-14-1', year: '2026', title: 'Inicio de Relación Comercial', description: 'Contacto inicial y propuesta de Web Corporativa + Hardening de Seguridad Digital.', category: 'milestone', actor: 'ana' },
      { id: 't-14-2', year: '2026', title: 'Aprobación y Anticipo Web', description: 'Web corporativa entra en fase de diseño de interfaz (En progreso).', category: 'upgrade', actor: 'martin' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py (En gestión)', renewer: 'agency', expiryDate: '2027-09-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG' }
    }
  }
];

const INITIAL_PROJECTS = [
  {
    id: 1,
    clientId: 14,
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
    assignedRole: 'martin'
  },
  {
    id: 2,
    clientId: 14,
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
    assignedRole: 'martin'
  },
  {
    id: 3,
    clientId: 5,
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
    assignedRole: 'martin'
  },
  {
    id: 4,
    clientId: 6,
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
    assignedRole: 'ana'
  }
];

async function runMigration() {
  console.log('🚀 [migrate] Running automated database migrations and schema sync...');
  const sql = neon(connectionString);

  // 1. Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      legal_name TEXT,
      ruc TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      acquisition_channel TEXT,
      drive_folder_url TEXT,
      timeline JSONB,
      infrastructure JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    ALTER TABLE clients 
    ADD COLUMN IF NOT EXISTS legal_name TEXT,
    ADD COLUMN IF NOT EXISTS ruc TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS acquisition_channel TEXT,
    ADD COLUMN IF NOT EXISTS drive_folder_url TEXT,
    ADD COLUMN IF NOT EXISTS timeline JSONB;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'wordpress',
      url TEXT NOT NULL,
      token TEXT,
      disk_allocated_gb DOUBLE PRECISION,
      status TEXT DEFAULT 'unknown',
      last_status_code INTEGER,
      last_response_time_ms INTEGER,
      last_checked_at TIMESTAMP,
      last_backup_at TIMESTAMP,
      wp_version TEXT,
      php_version TEXT,
      ssl_days_left INTEGER,
      site_health_score JSONB,
      pending_updates JSONB,
      wordfence_stats JSONB,
      performance_info JSONB,
      metadata JSONB,
      category TEXT DEFAULT 'web_wordpress',
      provider TEXT,
      billing JSONB,
      relationships JSONB,
      roadmap_notes TEXT,
      service_group TEXT DEFAULT 'General',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS service_groups (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'web_corp',
      status TEXT NOT NULL DEFAULT 'pending',
      waiting_on TEXT DEFAULT 'agency',
      budget INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'PYG',
      advance_paid INTEGER DEFAULT 0,
      target_delivery_date TEXT,
      notes TEXT,
      drive_url TEXT,
      assigned_role TEXT DEFAULT 'martin',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS config_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'security',
      settings JSONB NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS uptime_pings (
      id SERIAL PRIMARY KEY,
      site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
      checked_at TIMESTAMP DEFAULT NOW(),
      status_code INTEGER,
      response_time_ms INTEGER,
      is_up BOOLEAN NOT NULL,
      error_message TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS uptime_daily_rollup (
      id SERIAL PRIMARY KEY,
      site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      total_checks INTEGER NOT NULL,
      successful_checks INTEGER NOT NULL,
      uptime_percentage DOUBLE PRECISION NOT NULL,
      avg_response_time_ms INTEGER NOT NULL,
      min_response_time_ms INTEGER,
      max_response_time_ms INTEGER,
      incident_count INTEGER DEFAULT 0
    );
  `;

  // 2. Synchronize / update client data
  for (const client of INITIAL_CLIENTS) {
    await sql`
      INSERT INTO clients (
        id, name, legal_name, ruc, email, phone, company, notes,
        status, acquisition_channel, drive_folder_url, timeline, infrastructure
      ) VALUES (
        ${client.id}, ${client.name}, ${client.legalName}, ${client.ruc}, ${client.email}, ${client.phone}, ${client.company}, ${client.notes},
        ${client.status}, ${client.acquisitionChannel}, ${client.driveFolderUrl}, ${JSON.stringify(client.timeline || [])}, ${JSON.stringify(client.infrastructure)}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        legal_name = EXCLUDED.legal_name,
        ruc = EXCLUDED.ruc,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        company = EXCLUDED.company,
        notes = EXCLUDED.notes,
        status = EXCLUDED.status,
        acquisition_channel = EXCLUDED.acquisition_channel,
        drive_folder_url = EXCLUDED.drive_folder_url,
        timeline = EXCLUDED.timeline,
        infrastructure = EXCLUDED.infrastructure;
    `;
  }
  await sql`SELECT setval('clients_id_seq', (SELECT GREATEST(MAX(id), 1) FROM clients));`;

  // 3. Seed projects if table is empty
  const existingProjects = await sql`SELECT COUNT(*)::int as count FROM projects`;
  if (existingProjects[0].count === 0) {
    for (const p of INITIAL_PROJECTS) {
      await sql`
        INSERT INTO projects (
          id, client_id, name, category, status, waiting_on,
          budget, currency, advance_paid, target_delivery_date, notes, drive_url, assigned_role
        ) VALUES (
          ${p.id}, ${p.clientId}, ${p.name}, ${p.category}, ${p.status}, ${p.waitingOn},
          ${p.budget}, ${p.currency}, ${p.advancePaid}, ${p.targetDeliveryDate}, ${p.notes}, ${p.driveUrl}, ${p.assignedRole}
        ) ON CONFLICT (id) DO NOTHING;
      `;
    }
    await sql`SELECT setval('projects_id_seq', (SELECT GREATEST(MAX(id), 1) FROM projects));`;
  }

  // 4. Update connector token in WordPress sites
  const realToken =
    process.env.WF_REPORT_TOKEN && process.env.WF_REPORT_TOKEN.trim().length >= 64
      ? process.env.WF_REPORT_TOKEN.trim()
      : '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f';

  await sql`
    UPDATE sites
    SET token = ${realToken}
    WHERE type = 'wordpress';
  `;

  console.log('✅ [migrate] Database schema and CRM data synchronized successfully.');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ [migrate] Error during migration:', err);
    process.exit(1);
  });
