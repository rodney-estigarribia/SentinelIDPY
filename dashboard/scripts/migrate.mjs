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
    name: 'CGA Consultora de Gestión Ambiental',
    legalName: 'CONSULTORA DE GESTIÓN AMBIENTAL',
    ruc: '80092994-2',
    email: 'cgasociedadanonima@gmail.com',
    billingEmail: 'cgasociedadanonima@gmail.com',
    portalEmail: 'cgasociedadanonima@gmail.com',
    phone: '+595 981 234567',
    company: 'CGA Consultora de Gestión Ambiental S.A.',
    notes: 'Cliente corporativo integral. 3 servicios activos: 1) Sitio Web Institucional (WordPress), 2) Portal de Clientes (WordPress), 3) Microsoft 365 (Correo corporativo y productividad). Dominio propio (cga.com.py) y hosting cPanel.',
    status: 'active',
    clientType: 'real',
    servicePackage: 'mantenimiento_elite',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cga-gestion-ambiental',
    timeline: [
      { id: 't-2-1', year: '2022', title: 'Desarrollo Web Institucional WordPress', description: 'Sitio corporativo institucional (cga.com.py) y estructuración de presencia digital.', category: 'milestone', actor: 'martin' },
      { id: 't-2-2', year: '2024', title: 'Despliegue Portal Clientes WordPress', description: 'Plataforma WordPress en subdominio portal.cga.com.py para gestión de reportes ambientales.', category: 'upgrade', actor: 'martin' },
      { id: 't-2-3', year: '2025', title: 'Configuración e Integración Microsoft 365', description: 'Gestión de correos corporativos y suite ofimática en la nube.', category: 'upgrade', actor: 'ana' },
      { id: 't-2-4', year: '2026', title: 'Contrato Mantenimiento Plan Elite', description: 'Mantenimiento mensual recurrente activo (₲250.000 / mes) para web, portal y soporte cloud.', category: 'upgrade', actor: 'ana' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'client', expiryDate: '2026-12-15', annualCost: 150000, currency: 'PYG', notes: 'Dominio cga.com.py en nic.py (vence en diciembre)' },
      hosting: { provider: 'Hosting Paraguay (cPanel)', plan: 'Shared Business', annualCost: 450000, currency: 'PYG', notes: 'Hosting cPanel para web institucional y portal (vence anual en agosto)' },
      dns: { provider: 'cPanel Host', notes: 'DNS en cPanel con registros para Web, Portal y Microsoft 365' },
      email: { provider: 'Microsoft 365', accountsCount: 8, annualCost: 0, currency: 'USD', notes: 'Microsoft 365 Corporativo (Gestión de correo y productividad)' },
      systems: [
        { name: 'Sitio Web Institucional', type: 'WordPress', plan: 'cga.com.py' },
        { name: 'Portal Clientes CGA', type: 'WordPress', plan: 'portal.cga.com.py' },
        { name: 'Microsoft 365', type: 'M365 Suite', plan: 'Cuentas corporativas y soporte' }
      ]
    }
  },
  {
    id: 4,
    name: 'Cope Market Deli',
    legalName: 'Cope Market Deli S.A.',
    ruc: '80123456-7',
    email: 'contacto@copemarketdeli.com.py',
    phone: '+595 981 654321',
    company: 'Cope Market Deli',
    notes: 'Cliente histórico. Servicio dado de baja en 2026.',
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
    legalName: 'Dagda Comunicación & Eventos EAS',
    ruc: '80138071-5',
    email: 'armando_cubilla@hotmail.com',
    phone: '+595 981 333444',
    company: 'Dagda Comunicación & Eventos EAS',
    notes: 'Ecosistema tecnológico híbrido: Web WordPress institucional, plataforma móvil/web y backend en Render con licencias Microsoft 365.',
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
      email: { provider: 'Microsoft 365', accountsCount: 4, annualCost: 288, currency: 'USD' }
    }
  },
  {
    id: 6,
    name: 'GeneSur',
    legalName: 'GENE SUR SRL',
    ruc: '80017259-0',
    email: 'info@genesur.com.py',
    phone: '+595 981 555666',
    company: 'GeneSur Genética Bovina',
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
      email: { provider: 'Microsoft 365', accountsCount: 6, annualCost: 432, currency: 'USD' }
    }
  },
  {
    id: 7,
    name: 'Navíos Argentina',
    legalName: 'Navíos Logistics Argentina S.A.',
    ruc: '30-71234567-9',
    email: 'contacto@naviosargentina.com',
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
    legalName: 'SYNEXA E.A.S.',
    ruc: '80138132-0',
    email: 'contacto@synexa.com.py',
    phone: '+595 21 600 700',
    company: 'Synexa E.A.S.',
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
      email: { provider: 'Google Workspace', accountsCount: 2, annualCost: 144, currency: 'USD' }
    }
  },
  {
    id: 9,
    name: 'Misa Guaraní',
    legalName: 'MEAURIO MANCUELLO CLAUDIA LORENA',
    ruc: '5415611-4',
    email: 'contacto@misaguarani.com',
    phone: '+595 981 789456',
    company: 'Fundación Cultural Misa Guaraní',
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
    notes: 'En proceso de levantar su web: sitio web entregado al cliente, pendiente de instalación en su propio servidor.',
    status: 'active',
    acquisitionChannel: 'referral',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cna-consultora',
    timeline: [
      { id: 't-11-1', year: '2024', title: 'Lanzamiento Web Institucional', description: 'Sitio web WordPress corporativo.', category: 'milestone', actor: 'martin' },
      { id: 't-11-2', year: '2026', title: 'Entrega de Web en Proceso de Despliegue', description: 'Web entregada para instalación en servidor propio del cliente.', category: 'note', actor: 'rodney' }
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
    notes: 'Tuvieron web WordPress con nosotros, luego migraron externamente a Wix (fuera de nuestro control por ahora).',
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
    clientType: 'potential',
    servicePackage: 'hardening',
    billingEmail: 'facturacion@repar.com.py',
    portalEmail: 'contacto@repar.com.py',
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
  },
  {
    id: 15,
    name: 'Cabaña del Árbol',
    legalName: 'Cabaña del Árbol San Bernardino',
    ruc: '80149201-1',
    email: 'contacto@cabanadelarbol.com.py',
    phone: '+595 982 957509',
    company: 'Cabaña del Árbol',
    notes: 'Alquiler temporal en San Bernardino frente al Lago Ypacaraí. Proyecto Mi Primera Web MiPyME Express.',
    status: 'lead',
    clientType: 'potential',
    servicePackage: 'mipyme_express',
    billingEmail: 'facturacion@cabanadelarbol.com.py',
    portalEmail: 'reservas@cabanadelarbol.com.py',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/cabana-del-arbol',
    timeline: [
      { id: 't-15-1', year: '2026', title: 'Lanzamiento Demo Express 7 Días', description: 'Despliegue de landing page con timer y propuesta interactiva en San Bernardino.', category: 'milestone', actor: 'rodney' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py (Propuesto)', renewer: 'agency', expiryDate: '2027-09-23', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Vercel Edge', plan: 'Hobby/Impulsos Digitales', annualCost: 0, currency: 'USD' }
    }
  },
  {
    id: 16,
    name: 'Don Mendoza',
    legalName: 'Alcides Mendoza Denis',
    ruc: '80153890-4',
    email: 'contacto@donmendoza.com.py',
    phone: '+595 981 438296',
    company: 'Don Mendoza - Cuidado de Piscinas de Autor',
    notes: 'Servicio de mantenimiento y química de piscinas en Asunción y San Bernardino. Sitio comprado y activo.',
    status: 'active',
    clientType: 'real',
    servicePackage: 'mipyme_express',
    billingEmail: 'facturacion@donmendoza.com.py',
    portalEmail: 'contacto@donmendoza.com.py',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/don-mendoza',
    timeline: [
      { id: 't-16-1', year: '2026', title: 'Sitio Comprado y Publicado', description: 'Sitio web activo con animaciones 3D e integración de WhatsApp para presupuestos.', category: 'milestone', actor: 'rodney' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2027-09-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Vercel Edge', plan: 'Impulsos Digitales', annualCost: 0, currency: 'USD' }
    }
  },
  {
    id: 17,
    name: 'Terrazas Bungalow',
    legalName: 'Terrazas Bungalow Alquileres',
    ruc: '80164210-9',
    email: 'contacto@terrazasbungalow.com.py',
    phone: '+595 981 000000',
    company: 'Terrazas Bungalow',
    notes: 'Complejo de descanso y bungalows. Sitio adquirido y activo.',
    status: 'active',
    clientType: 'real',
    servicePackage: 'mipyme_express',
    billingEmail: 'facturacion@terrazasbungalow.com.py',
    portalEmail: 'reservas@terrazasbungalow.com.py',
    acquisitionChannel: 'direct',
    driveFolderUrl: 'https://drive.google.com/drive/folders/terrazas-bungalow',
    timeline: [
      { id: 't-17-1', year: '2026', title: 'Sitio Web Adquirido', description: 'Landing y cotizador directo para bungalows activo en Vercel.', category: 'milestone', actor: 'rodney' }
    ],
    infrastructure: {
      domain: { provider: 'nic.py', renewer: 'agency', expiryDate: '2027-09-01', annualCost: 150000, currency: 'PYG' },
      hosting: { provider: 'Vercel Edge', plan: 'Impulsos Digitales', annualCost: 0, currency: 'USD' }
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
  },
  {
    id: 5,
    clientId: 2,
    name: 'Sitio Web Institucional CGA',
    category: 'web_corp',
    status: 'completed',
    waitingOn: 'agency',
    budget: 1800000,
    currency: 'PYG',
    advancePaid: 1800000,
    targetDeliveryDate: '2026-01-31',
    notes: 'Sitio web WordPress corporativo institucional bajo Mantenimiento Plan Elite.',
    driveUrl: 'https://drive.google.com/drive/folders/cga-gestion-ambiental/web',
    assignedRole: 'martin'
  },
  {
    id: 6,
    clientId: 2,
    name: 'Portal Clientes CGA (WordPress)',
    category: 'web_corp',
    status: 'completed',
    waitingOn: 'agency',
    budget: 2500000,
    currency: 'PYG',
    advancePaid: 2500000,
    targetDeliveryDate: '2026-02-15',
    notes: 'Plataforma web WordPress portal.cga.com.py para gestión y reportes ambientales.',
    driveUrl: 'https://drive.google.com/drive/folders/cga-portal-app',
    assignedRole: 'martin'
  },
  {
    id: 7,
    clientId: 2,
    name: 'Gestión & Soporte Microsoft 365 CGA',
    category: 'consulting',
    status: 'completed',
    waitingOn: 'client',
    budget: 850000,
    currency: 'PYG',
    advancePaid: 850000,
    targetDeliveryDate: '2026-03-01',
    notes: 'Administración de cuentas de correo y configuración de registros MX/SPF/DKIM Microsoft 365.',
    driveUrl: 'https://drive.google.com/drive/folders/cga-gestion-ambiental/m365',
    assignedRole: 'ana'
  },
  {
    id: 8,
    clientId: 5,
    name: 'Sitio Web Institucional Dagda',
    category: 'web_corp',
    status: 'completed',
    waitingOn: 'agency',
    budget: 2200000,
    currency: 'PYG',
    advancePaid: 2200000,
    targetDeliveryDate: '2026-01-15',
    notes: 'Sitio web institucional en cPanel con catálogo de eventos y enlaces corporativos.',
    driveUrl: 'https://drive.google.com/drive/folders/dagda-eventos-2026/web',
    assignedRole: 'martin'
  },
  {
    id: 9,
    clientId: 5,
    name: 'Plataforma Integral Dagda (App Móvil, WebApp & Backend Render)',
    category: 'mobile_app',
    status: 'in_progress',
    waitingOn: 'agency',
    budget: 4500000,
    currency: 'PYG',
    advancePaid: 2000000,
    targetDeliveryDate: '2026-11-30',
    notes: 'Ecosistema móvil iOS/Android + Backend Render Postgres + WebApp Angular/React.',
    driveUrl: 'https://drive.google.com/drive/folders/dagda-app',
    assignedRole: 'martin'
  },
  {
    id: 10,
    clientId: 5,
    name: 'Microsoft 365 & Licencias Ofimática Dagda',
    category: 'consulting',
    status: 'completed',
    waitingOn: 'client',
    budget: 1200000,
    currency: 'PYG',
    advancePaid: 1200000,
    targetDeliveryDate: '2026-02-10',
    notes: 'Gestión y administración de cuentas corporativas Microsoft 365 y licencias Office.',
    driveUrl: 'https://drive.google.com/drive/folders/dagda-eventos-2026/ofimatica',
    assignedRole: 'ana'
  }
];

const INITIAL_PAYMENTS = [
  { id: 1, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-01-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento preventivo Plan Elite Enero 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-001', status: 'completed', notes: 'Transferencia Itaú' },
  { id: 2, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-01-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento mensual CGA Corporativo', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-002', status: 'completed', notes: 'Facturado con IVA' },
  { id: 3, clientId: 5, projectId: null, amount: 600000, currency: 'PYG', date: '2026-01-28', concept: 'consultoria', description: 'Soporte y configuración Cloud Render/Postgres', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-003', status: 'completed', notes: 'Consultoría técnica' },
  { id: 4, clientId: 14, projectId: 1, amount: 1250000, currency: 'PYG', date: '2026-02-10', concept: 'anticipo_proyecto', description: 'Anticipo 50% Sitio Web Corporativo Repar', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-004', status: 'completed', notes: 'Inicio de diseño UI/UX' },
  { id: 5, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-02-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Febrero 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-005', status: 'completed', notes: '' },
  { id: 6, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-02-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Febrero 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-006', status: 'completed', notes: '' },
  { id: 7, clientId: 5, projectId: 3, amount: 2980000, currency: 'PYG', date: '2026-02-27', concept: 'anticipo_proyecto', description: 'Desarrollo Frontend Web v2 y sincronización API', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-007', status: 'completed', notes: 'Desarrollo en curso' },
  { id: 8, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-03-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Marzo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-008', status: 'completed', notes: '' },
  { id: 9, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-03-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Marzo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-009', status: 'completed', notes: '' },
  { id: 10, clientId: 10, projectId: null, amount: 650000, currency: 'PYG', date: '2026-04-12', concept: 'renovacion_anual', description: 'Renovación anual de hosting cPanel 15GB', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-010', status: 'completed', notes: 'Vence abril 2027' },
  { id: 11, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-04-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Abril 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-011', status: 'completed', notes: '' },
  { id: 12, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-04-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Abril 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-012', status: 'completed', notes: '' },
  { id: 13, clientId: 8, projectId: null, amount: 580000, currency: 'PYG', date: '2026-04-26', concept: 'consultoria', description: 'Soporte y configuración Microsoft 365', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-013', status: 'completed', notes: '' },
  { id: 14, clientId: 13, projectId: null, amount: 350000, currency: 'PYG', date: '2026-05-10', concept: 'renovacion_anual', description: 'Renovación anual hosting cPanel 5GB Mercopar', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-014', status: 'completed', notes: '' },
  { id: 15, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-05-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Mayo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-015', status: 'completed', notes: '' },
  { id: 16, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-05-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Mayo 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-016', status: 'completed', notes: '' },
  { id: 17, clientId: 11, projectId: null, amount: 350000, currency: 'PYG', date: '2026-06-12', concept: 'renovacion_anual', description: 'Renovación anual hosting cPanel CNA', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-017', status: 'completed', notes: '' },
  { id: 18, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-06-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Junio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-018', status: 'completed', notes: '' },
  { id: 19, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-06-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Junio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-019', status: 'completed', notes: '' },
  { id: 20, clientId: 9, projectId: null, amount: 480000, currency: 'PYG', date: '2026-07-15', concept: 'renovacion_anual', description: 'Mantenimiento Plan Pro Anual Misa Guaraní', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-020', status: 'completed', notes: '' },
  { id: 21, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-07-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Julio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-021', status: 'completed', notes: '' },
  { id: 22, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-07-25', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Julio 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-022', status: 'completed', notes: '' },
  { id: 23, clientId: 6, projectId: 4, amount: 1250000, currency: 'PYG', date: '2026-08-10', concept: 'anticipo_proyecto', description: 'Anticipo Mantenimiento & Auditoría Anual 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-023', status: 'completed', notes: 'Auditoría SEO y catálogo' },
  { id: 24, clientId: 6, projectId: null, amount: 250000, currency: 'PYG', date: '2026-08-15', concept: 'mantenimiento_mensual', description: 'Mantenimiento Plan Elite Agosto 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-024', status: 'completed', notes: '' },
  { id: 25, clientId: 2, projectId: null, amount: 250000, currency: 'PYG', date: '2026-08-20', concept: 'mantenimiento_mensual', description: 'Mantenimiento CGA Corp Agosto 2026', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-025', status: 'completed', notes: '' },
  { id: 26, clientId: 8, projectId: null, amount: 850000, currency: 'PYG', date: '2026-08-26', concept: 'consultoria', description: 'Servicios de consultoría TI y optimización', paymentMethod: 'transferencia', receiptNumber: 'FAC-2026-026', status: 'completed', notes: '' }
];

const INITIAL_SITES = [
  { id: 1, clientId: 1, name: 'IDPY Admin', type: 'wordpress', url: 'https://admin.impulsosdigitales.com.py', serviceGroup: 'General' },
  { id: 2, clientId: 2, name: 'CGA Corporativo (Web)', type: 'wordpress', url: 'https://cga.com.py', serviceGroup: 'Ecosistema Digital CGA' },
  { id: 3, clientId: 2, name: 'CGA Portal Clientes', type: 'wordpress', url: 'https://portal.cga.com.py', serviceGroup: 'Ecosistema Digital CGA' },
  { id: 4, clientId: 4, name: 'Cope Market Deli', type: 'wordpress', url: 'https://copemarketdeli.com.py', serviceGroup: 'General' },
  { id: 5, clientId: 5, name: 'dagda.com.py (Dominio)', category: 'dominio', type: 'sistema', url: 'https://nic.py', serviceGroup: 'Plataforma Dagda' },
  { id: 501, clientId: 5, name: 'Hosting & DNS cPanel', category: 'hosting', type: 'sistema', url: 'https://cpanel.dagda.com.py:2083', serviceGroup: 'Plataforma Dagda' },
  { id: 502, clientId: 5, name: 'Correo Corporativo (Microsoft 365)', category: 'correo', type: 'sistema', url: 'https://outlook.office.com', serviceGroup: 'Sistemas Empresariales' },
  { id: 503, clientId: 5, name: 'Office 365 Personal / Familiar', category: 'licencia', type: 'sistema', url: 'https://account.microsoft.com', serviceGroup: 'Sistemas Empresariales' },
  { id: 504, clientId: 5, name: 'Backend API & Base de Datos (Render Postgres)', category: 'servidor_bd', type: 'sistema', url: 'https://api.dagda.com.py', serviceGroup: 'Plataforma Dagda' },
  { id: 505, clientId: 5, name: 'App Móvil Dagda (Android & iOS)', category: 'app_movil', type: 'sistema', url: 'https://play.google.com/store/apps', serviceGroup: 'Plataforma Dagda' },
  { id: 506, clientId: 5, name: 'Web App & Panel Admin (Angular)', category: 'web_app', type: 'sistema', url: 'https://app.dagda.com.py', serviceGroup: 'Plataforma Dagda' },
  { id: 6, clientId: 6, name: 'GeneSur', type: 'wordpress', url: 'https://genesur.com.py', serviceGroup: 'General' },
  { id: 7, clientId: 7, name: 'Navíos Argentina', type: 'sistema', url: 'https://naviosargentina.com', serviceGroup: 'General' },
  { id: 8, clientId: 8, name: 'Synexa', type: 'vercel', url: 'https://synexa.com.py', serviceGroup: 'General' },
  { id: 9, clientId: 9, name: 'Misa Guarani', type: 'wordpress', url: 'https://misaguarani.com', serviceGroup: 'General' },
  { id: 10, clientId: 10, name: 'My Life', type: 'wordpress', url: 'https://mylife.com.py', serviceGroup: 'General' },
  {
    id: 11,
    clientId: 15,
    name: 'Cabaña del Árbol',
    type: 'vercel',
    url: 'https://cabana-del-arbol-demo.vercel.app',
    serviceGroup: 'General',
    siteConfig: {
      slug: 'cabana-del-arbol',
      demo: { active: true, startDate: '2026-09-23', days: 8 },
      proposal: { active: true },
      whatsapp: { phone: '595982957509', defaultMessage: '¡Hola! Estuve viendo la web de Cabaña del Árbol y quisiera consultar disponibilidad. ¿Me podrían ayudar? 🌿' }
    }
  },
  {
    id: 12,
    clientId: 16,
    name: 'Don Mendoza',
    type: 'vercel',
    url: 'https://donmendoza.com.py',
    serviceGroup: 'General',
    siteConfig: {
      slug: 'don-mendoza',
      demo: { active: false, startDate: '2026-09-01', days: 7 },
      proposal: { active: false },
      whatsapp: { phone: '595981438296', defaultMessage: 'Hola Don Mendoza, quisiera consultar disponibilidad para un diagnóstico técnico en mi piscina.' }
    }
  },
  {
    id: 13,
    clientId: 17,
    name: 'Terrazas Bungalow',
    type: 'vercel',
    url: 'https://terrazasbungalow.com.py',
    serviceGroup: 'General',
    siteConfig: {
      slug: 'terrazas-bungalow',
      demo: { active: false, startDate: '2026-09-01', days: 7 },
      proposal: { active: false },
      whatsapp: { phone: '595981000000', defaultMessage: '¡Hola! Quisiera consultar disponibilidad en Terrazas Bungalow.' }
    }
  },
  {
    id: 201,
    clientId: 2,
    name: 'Microsoft 365 CGA (Correo & Productividad)',
    category: 'correo',
    provider: 'Microsoft 365',
    serviceGroup: 'Ecosistema Digital CGA',
    type: 'sistema',
    url: 'https://outlook.office.com'
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
    ADD COLUMN IF NOT EXISTS timeline JSONB,
    ADD COLUMN IF NOT EXISTS infrastructure JSONB;
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
    ALTER TABLE sites 
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'web_wordpress',
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS billing JSONB,
    ADD COLUMN IF NOT EXISTS relationships JSONB,
    ADD COLUMN IF NOT EXISTS roadmap_notes TEXT,
    ADD COLUMN IF NOT EXISTS service_group TEXT DEFAULT 'General';
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
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PYG',
      date TEXT NOT NULL,
      concept TEXT NOT NULL,
      description TEXT,
      payment_method TEXT DEFAULT 'transferencia',
      receipt_number TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
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
    ALTER TABLE config_templates
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'security',
    ADD COLUMN IF NOT EXISTS config_type TEXT DEFAULT 'wp_options',
    ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
  `;

  await sql`
    ALTER TABLE sites
    ADD COLUMN IF NOT EXISTS site_config JSONB;
  `;

  await sql`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'real',
    ADD COLUMN IF NOT EXISTS service_package TEXT DEFAULT 'custom',
    ADD COLUMN IF NOT EXISTS billing_email TEXT,
    ADD COLUMN IF NOT EXISTS portal_email TEXT,
    ADD COLUMN IF NOT EXISTS billing_details JSONB;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS site_events (
      id SERIAL PRIMARY KEY,
      site_slug TEXT NOT NULL,
      event_type TEXT NOT NULL,
      path TEXT DEFAULT '/',
      referrer TEXT,
      country TEXT,
      city TEXT,
      device TEXT DEFAULT 'desktop',
      visitor_hash TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
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

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const DEFAULT_FINANCIAL_SETTINGS = {
    currentLadderStep: 1,
    targetLadderStep: 2,
    targetSalary: 3500000,
    distributionRules: {
      iva: 0.10,
      opex: 0.15,
      reserve: 0.05,
      reinvestment: 0.10,
      salaryAndCushion: 0.60,
    },
    salaryLadder: [
      { step: 1, name: 'Escalón 1', withdrawableSalary: 600000, avgRequiredBilling: 1100000, minCushion: 2000000, downgradeRule: 'Piso base (no baja más)', active: true },
      { step: 2, name: 'Escalón 2', withdrawableSalary: 1000000, avgRequiredBilling: 1700000, minCushion: 2000000, downgradeRule: 'Si Colchón < ₲1.000.000 tras 3 meses bajos → Vuelve a ₲600.000', active: false },
      { step: 3, name: 'Escalón 3', withdrawableSalary: 1500000, avgRequiredBilling: 2500000, minCushion: 4500000, downgradeRule: 'Si Colchón < ₲2.250.000 tras 3 meses bajos → Vuelve a ₲1.000.000', active: false },
      { step: 4, name: 'Escalón 4', withdrawableSalary: 2000000, avgRequiredBilling: 3350000, minCushion: 6000000, downgradeRule: 'Si Colchón < ₲3.000.000 tras 3 meses bajos → Vuelve a ₲1.500.000', active: false }
    ]
  };

  await sql`
    INSERT INTO app_settings (key, value)
    VALUES ('salary_ladder_config', ${JSON.stringify(DEFAULT_FINANCIAL_SETTINGS)})
    ON CONFLICT (key) DO NOTHING;
  `;

  // 1.1 Consolidate CGA: Reassign ID 3 to ID 2 and delete duplicate client 3
  try {
    await sql`UPDATE sites SET client_id = 2 WHERE client_id = 3;`;
    await sql`UPDATE sites SET type = 'wordpress' WHERE id = 3 OR url LIKE '%portal.cga.com.py%';`;
    await sql`UPDATE projects SET client_id = 2 WHERE client_id = 3;`;
    await sql`UPDATE payments SET client_id = 2 WHERE client_id = 3;`;
    await sql`UPDATE service_groups SET client_id = 2 WHERE client_id = 3;`;
    await sql`DELETE FROM clients WHERE id = 3;`;
  } catch (err) {
    console.log('ℹ️ [migrate] Notice on CGA consolidation:', err.message);
  }

  // 2. Synchronize / update client data (including Don Mendoza, Terrazas, Cabaña del Árbol, and unified CGA)
  for (const client of INITIAL_CLIENTS) {
    await sql`
      INSERT INTO clients (
        id, name, legal_name, ruc, email, phone, company, notes,
        status, acquisition_channel, client_type, service_package,
        billing_email, portal_email, drive_folder_url, timeline, infrastructure
      ) VALUES (
        ${client.id}, ${client.name}, ${client.legalName || null}, ${client.ruc || null}, ${client.email || null}, ${client.phone || null}, ${client.company || null}, ${client.notes || null},
        ${client.status || 'active'}, ${client.acquisitionChannel || 'direct'}, ${client.clientType || 'real'}, ${client.servicePackage || 'custom'},
        ${client.billingEmail || null}, ${client.portalEmail || null}, ${client.driveFolderUrl || null}, ${JSON.stringify(client.timeline || [])}, ${JSON.stringify(client.infrastructure || {})}
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
        client_type = EXCLUDED.client_type,
        service_package = EXCLUDED.service_package,
        billing_email = EXCLUDED.billing_email,
        portal_email = EXCLUDED.portal_email,
        drive_folder_url = EXCLUDED.drive_folder_url,
        timeline = EXCLUDED.timeline,
        infrastructure = EXCLUDED.infrastructure,
        updated_at = NOW();
    `;
  }
  await sql`SELECT setval('clients_id_seq', (SELECT GREATEST(MAX(id), 1) FROM clients));`;

  // 2.1 Synchronize / update sites data (including Vercel sites: Cabaña, Don Mendoza, Terrazas, and M365 #201)
  for (const s of INITIAL_SITES) {
    await sql`
      INSERT INTO sites (
        id, client_id, name, type, url, category, provider, service_group, site_config
      ) VALUES (
        ${s.id}, ${s.clientId}, ${s.name}, ${s.type}, ${s.url}, ${s.category || null}, ${s.provider || null}, ${s.serviceGroup || 'General'}, ${JSON.stringify(s.siteConfig || {})}
      )
      ON CONFLICT (id) DO UPDATE SET
        client_id = EXCLUDED.client_id,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        url = EXCLUDED.url,
        category = COALESCE(EXCLUDED.category, sites.category),
        provider = COALESCE(EXCLUDED.provider, sites.provider),
        service_group = EXCLUDED.service_group,
        site_config = COALESCE(sites.site_config, EXCLUDED.site_config),
        updated_at = NOW();
    `;
  }
  await sql`SELECT setval('sites_id_seq', (SELECT GREATEST(MAX(id), 1) FROM sites));`;

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

  // 4. Seed payments if table is empty
  const existingPayments = await sql`SELECT COUNT(*)::int as count FROM payments`;
  if (existingPayments[0].count === 0) {
    for (const py of INITIAL_PAYMENTS) {
      await sql`
        INSERT INTO payments (
          id, client_id, project_id, amount, currency, date, concept,
          description, payment_method, receipt_number, status, notes
        ) VALUES (
          ${py.id}, ${py.clientId}, ${py.projectId || null}, ${py.amount}, ${py.currency || 'PYG'},
          ${py.date}, ${py.concept}, ${py.description || ''}, ${py.paymentMethod || 'transferencia'},
          ${py.receiptNumber || ''}, ${py.status || 'completed'}, ${py.notes || ''}
        ) ON CONFLICT (id) DO NOTHING;
      `;
    }
    await sql`SELECT setval('payments_id_seq', (SELECT GREATEST(MAX(id), 1) FROM payments));`;
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

  // 5. Synchronize pending updates matching MainWP (12 updates: 5 plugins, 7 translations)
  const site1Updates = {
    plugins: 2,
    themes: 0,
    wordpress: 0,
    translations: 2,
    details: [
      { type: 'plugin', slug: 'updraftplus', name: 'UpdraftPlus - Backup/Restore', currentVersion: '1.24.14', newVersion: '1.28.7' },
      { type: 'plugin', slug: 'wordpress-plugin', name: 'SentinelIDPY Connector', currentVersion: '4.2', newVersion: '4.3' },
      { type: 'translation', slug: 'es_ES_updraftplus', name: 'Traducciones al Español (UpdraftPlus & Plugins)', currentVersion: 'Actual', newVersion: 'Disponible' },
      { type: 'translation', slug: 'es_ES_core_idpy', name: 'Traducciones WordPress al Español (es_ES)', currentVersion: 'Actual', newVersion: 'Disponible' }
    ]
  };

  const site4Updates = {
    plugins: 1,
    themes: 0,
    wordpress: 0,
    translations: 2,
    details: [
      { type: 'plugin', slug: 'wordpress-plugin', name: 'SentinelIDPY Connector', currentVersion: '4.2', newVersion: '4.3' },
      { type: 'translation', slug: 'es_ES_cope', name: 'Traducciones WordPress al Español (es_ES)', currentVersion: 'Actual', newVersion: 'Disponible' },
      { type: 'translation', slug: 'es_ES_litespeed_cope', name: 'Traducciones LiteSpeed Cache al Español', currentVersion: 'Actual', newVersion: 'Disponible' }
    ]
  };

  const site6Updates = {
    plugins: 1,
    themes: 0,
    wordpress: 0,
    translations: 2,
    details: [
      { type: 'plugin', slug: 'wordpress-plugin', name: 'SentinelIDPY Connector', currentVersion: '4.2', newVersion: '4.3' },
      { type: 'translation', slug: 'es_ES_genesur', name: 'Traducciones WordPress al Español (es_ES)', currentVersion: 'Actual', newVersion: 'Disponible' },
      { type: 'translation', slug: 'es_ES_plugins_genesur', name: 'Traducciones de Plugins del Sistema', currentVersion: 'Actual', newVersion: 'Disponible' }
    ]
  };

  const site10Updates = {
    plugins: 1,
    themes: 0,
    wordpress: 0,
    translations: 1,
    details: [
      { type: 'plugin', slug: 'wordpress-plugin', name: 'SentinelIDPY Connector', currentVersion: '4.2', newVersion: '4.3' },
      { type: 'translation', slug: 'es_ES_mylife', name: 'Traducciones WordPress al Español (es_ES)', currentVersion: 'Actual', newVersion: 'Disponible' }
    ]
  };

  await sql`
    UPDATE sites
    SET pending_updates = ${JSON.stringify(site1Updates)}
    WHERE id = 1;
  `;
  await sql`
    UPDATE sites
    SET pending_updates = ${JSON.stringify(site4Updates)}
    WHERE id = 4;
  `;
  await sql`
    UPDATE sites
    SET pending_updates = ${JSON.stringify(site6Updates)}
    WHERE id = 6;
  `;
  await sql`
    UPDATE sites
    SET pending_updates = ${JSON.stringify(site10Updates)}
    WHERE id = 10;
  `;

  // 6. Record schema version 6 in app_settings
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('schema_version', ${JSON.stringify({ version: 6 })}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
  `;

  console.log('✅ [migrate] Database schema and CRM data synchronized successfully (MainWP updates aligned, Schema v6).');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ [migrate] Error during migration:', err);
    process.exit(1);
  });
