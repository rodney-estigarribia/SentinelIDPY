import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
import type { Client, Site, NewClient, NewSite, ConfigTemplate } from '@/db/schema';

// Initial seed data from clientes.json and infrastructure mappings
const INITIAL_CLIENTS: Array<Client> = [
  {
    id: 1,
    name: 'IDPY (Impulsos Digitales)',
    email: 'admin@impulsosdigitales.com.py',
    phone: '+595 981 123456',
    company: 'Impulsos Digitales',
    notes: 'Agencia matriz y portal administrativo',
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2027-03-15', annualCost: 150000, currency: 'PYG', notes: 'Renovación automática' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'VPS Pro', annualCost: 1200000, currency: 'PYG', notes: 'Servidor principal' },
      dns: { provider: 'Cloudflare', notes: 'DNS primario con proxy activado' },
      email: { provider: 'Google Workspace', accountsCount: 5, annualCost: 360, currency: 'USD' },
      systems: [{ name: 'SentinelIDPY Panel', type: 'Vercel', plan: 'Hobby/Pro' }]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'CGA',
    email: 'contacto@cga.com.py',
    phone: '+595 981 234567',
    company: 'CGA Consultores',
    notes: 'Cliente corporativo - Web institucional y Portal',
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-11-20', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG' },
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
    email: 'admin@cga.com.py',
    phone: '+595 981 234567',
    company: 'CGA Consultores',
    notes: 'Portal web interno de clientes',
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
    email: 'contacto@copemarketdeli.com.py',
    phone: '+595 981 345678',
    company: 'Cope Market Deli S.A.',
    notes: 'E-commerce y catálogo gastronómico',
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
    email: 'info@dagda.com.py',
    phone: '+595 981 456789',
    company: 'Dagda Brewery & Resto',
    notes: 'Sitio de marca y reservas',
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-12-05', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'cPanel Webmail', accountsCount: 4, annualCost: 0, currency: 'PYG' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    name: 'GeneSur',
    email: 'info@genesur.com.py',
    phone: '+595 981 567890',
    company: 'GeneSur Genética Bovina',
    notes: 'Catálogo de genética e inseminación',
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2027-02-18', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Microsoft 365', accountsCount: 6, annualCost: 432, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    name: 'Navíos Argentina',
    email: 'contacto@naviosargentina.com',
    phone: '+54 11 4321 0000',
    company: 'Navíos Logistics',
    notes: 'Portal logístico regional',
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
    email: 'contacto@synexa.com.py',
    phone: '+595 981 678901',
    company: 'Synexa Soluciones Tecnológicas',
    notes: 'Landing tecnológica y captación B2B',
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
    email: 'contacto@misaguarani.com',
    phone: '+595 981 789012',
    company: 'Fundación Cultural Misa Guaraní',
    notes: 'Sitio cultural multimedia y fonoteca',
    infrastructure: {
      domain: { provider: 'Namecheap (.com)', renewer: 'agency', expiryDate: '2027-04-12', annualCost: 16, currency: 'USD' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 10GB', annualCost: 550000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'cPanel Webmail', accountsCount: 3, annualCost: 0, currency: 'PYG' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 10,
    name: 'My Life',
    email: 'contacto@mylife.com.py',
    phone: '+595 981 890123',
    company: 'My Life Asunción',
    notes: 'Sitio inmobiliario y desarrollos urbanos',
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2026-12-28', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared 15GB', annualCost: 650000, currency: 'PYG' },
      dns: { provider: 'cPanel Host' },
      email: { provider: 'Google Workspace', accountsCount: 8, annualCost: 576, currency: 'USD' }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const INITIAL_SITES: Array<Site> = [
  {
    id: 1,
    clientId: 1,
    name: 'IDPY Admin',
    type: 'wordpress',
    url: 'https://admin.impulsosdigitales.com.py',
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
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
      plugins: 1,
      themes: 0,
      wordpress: 0,
      details: [
        { type: 'plugin', slug: 'wordfence', name: 'Wordfence Security', currentVersion: '7.11.7', newVersion: '7.11.8' }
      ]
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
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
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
      plugins: 3,
      themes: 1,
      wordpress: 0,
      details: [
        { type: 'plugin', slug: 'elementor', name: 'Elementor', currentVersion: '3.25.0', newVersion: '3.25.3' },
        { type: 'plugin', slug: 'contact-form-7', name: 'Contact Form 7', currentVersion: '5.9.8', newVersion: '6.0' },
        { type: 'plugin', slug: 'updraftplus', name: 'UpdraftPlus', currentVersion: '1.24.4', newVersion: '1.24.6' },
        { type: 'theme', slug: 'astra', name: 'Astra Theme', currentVersion: '4.8.1', newVersion: '4.8.4' }
      ]
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
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
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
      plugins: 2,
      themes: 0,
      wordpress: 1,
      details: [
        { type: 'core', slug: 'wordpress', name: 'WordPress Core', currentVersion: '6.6.2', newVersion: '6.7.1' },
        { type: 'plugin', slug: 'woocommerce', name: 'WooCommerce', currentVersion: '9.3.3', newVersion: '9.4.1' },
        { type: 'plugin', slug: 'wp-mail-smtp', name: 'WP Mail SMTP', currentVersion: '4.1.0', newVersion: '4.2.0' }
      ]
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
    name: 'Dagda',
    type: 'wordpress',
    url: 'https://dagda.com.py',
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
    diskAllocatedGb: 2.93,
    status: 'online',
    lastStatusCode: 200,
    lastResponseTimeMs: 380,
    lastCheckedAt: new Date(),
    lastBackupAt: new Date(Date.now() - 24 * 3600 * 1000),
    wpVersion: '6.7.1',
    phpVersion: '8.2.20',
    sslDaysLeft: 60,
    siteHealthScore: { status: 'good', good: 15, recommended: 1, critical: 0 },
    pendingUpdates: { plugins: 0, themes: 0, wordpress: 0 },
    wordfenceStats: { totalAttacks: 650, lastScan: '2026-09-19 12:00:00', rulesOk: true },
    performanceInfo: { siteSizeGb: 1.8, diskFreeGb: 1.13 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    clientId: 6,
    name: 'GeneSur',
    type: 'wordpress',
    url: 'https://genesur.com.py',
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
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
    pendingUpdates: { plugins: 2, themes: 0, wordpress: 0 },
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
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
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
    pendingUpdates: { plugins: 1, themes: 0, wordpress: 0 },
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
    token: process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0',
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
      plugins: 4,
      themes: 0,
      wordpress: 0,
      details: [
        { type: 'plugin', slug: 'wp-rocket', name: 'WP Rocket', currentVersion: '3.16.2', newVersion: '3.17.0' },
        { type: 'plugin', slug: 'seo-by-rank-math', name: 'Rank Math SEO', currentVersion: '1.0.228', newVersion: '1.0.231' },
        { type: 'plugin', slug: 'imagify', name: 'Imagify', currentVersion: '2.2.4', newVersion: '2.2.5' },
        { type: 'plugin', slug: 'wordfence', name: 'Wordfence Security', currentVersion: '7.11.7', newVersion: '7.11.8' }
      ]
    },
    wordfenceStats: { totalAttacks: 3120, lastScan: '2026-09-19 02:00:00', rulesOk: true },
    performanceInfo: { cachePlugin: 'WP Rocket', cacheEnabled: true, siteSizeGb: 6.2, diskFreeGb: 4.29 },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

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

// Fallback in-memory stores (in case DB is not yet migrated or offline)
let memoryClients = [...INITIAL_CLIENTS];
let memorySites = [...INITIAL_SITES];
let memoryTemplates = [...INITIAL_TEMPLATES];

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
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      notes: data.notes || null,
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
  async logActivity(siteId: number | null, action: string, status: 'success' | 'failed' | 'running', details?: any) {
    if (db) {
      try {
        await db.insert(schema.activityLogs).values({ siteId, action, status, details });
      } catch (err) {
        console.warn('Activity log failed:', err);
      }
    }
  }
};
