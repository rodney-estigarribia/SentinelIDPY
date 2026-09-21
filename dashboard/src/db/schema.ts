import { pgTable, serial, text, timestamp, integer, doublePrecision, boolean, jsonb, date } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  notes: text('notes'),
  // Infrastructure map: domain, hosting, dns, email, systems, costs
  infrastructure: jsonb('infrastructure').$type<{
    domain?: {
      provider: string;
      renewer: 'agency' | 'client';
      expiryDate?: string;
      annualCost?: number;
      currency?: string;
      notes?: string;
    };
    hosting?: {
      provider: string;
      cpanelUrl?: string;
      plan?: string;
      annualCost?: number;
      currency?: string;
      notes?: string;
    };
    dns?: {
      provider: string;
      notes?: string;
    };
    email?: {
      provider: string; // Google Workspace, Microsoft 365, cPanel, Zoho
      accountsCount?: number;
      plan?: string;
      annualCost?: number;
      currency?: string;
      notes?: string;
    };
    systems?: Array<{
      name: string;
      type: string; // Vercel, Render, Mobile App, Docker
      url?: string;
      plan?: string;
      cost?: number;
    }>;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('wordpress'), // 'wordpress', 'vercel', 'sistema'
  url: text('url').notNull(),
  token: text('token'), // SentinelIDPY connector secret token (X-WF-Report-Token)
  diskAllocatedGb: doublePrecision('disk_allocated_gb'),
  status: text('status').default('unknown'), // 'online', 'offline', 'warning', 'unknown'
  lastStatusCode: integer('last_status_code'),
  lastResponseTimeMs: integer('last_response_time_ms'),
  lastCheckedAt: timestamp('last_checked_at'),
  lastBackupAt: timestamp('last_backup_at'),
  wpVersion: text('wp_version'),
  phpVersion: text('php_version'),
  sslDaysLeft: integer('ssl_days_left'),
  siteHealthScore: jsonb('site_health_score').$type<{
    status: 'good' | 'recommended' | 'critical';
    good: number;
    recommended: number;
    critical: number;
  }>(),
  pendingUpdates: jsonb('pending_updates').$type<{
    plugins: number;
    themes: number;
    wordpress: number;
    details?: Array<{
      type: 'plugin' | 'theme' | 'core';
      slug: string;
      name: string;
      currentVersion: string;
      newVersion: string;
    }>;
  }>(),
  wordfenceStats: jsonb('wordfence_stats').$type<{
    totalAttacks: number;
    lastScan?: string;
    rulesOk: boolean;
    rulesDetail?: string;
    topIps?: Array<{ ip: string; count: number }>;
    topUrls?: Array<{ url: string; count: number }>;
    topUsernames?: Array<{ user: string; count: number }>;
  }>(),
  performanceInfo: jsonb('performance_info').$type<{
    cachePlugin?: string;
    cacheEnabled?: boolean;
    siteSizeGb?: number;
    diskFreeGb?: number;
  }>(),
  metadata: jsonb('metadata').$type<{
    vercelProjectId?: string;
    gitRepo?: string;
    mobileStoreUrl?: string;
    notes?: string;
  }>(),
  // Services & Assets extensions
  category: text('category').default('web_wordpress'), // 'web_wordpress', 'web_app', 'vercel', 'dominio', 'hosting', 'dns', 'correo', 'servidor_bd', 'app_movil', 'licencia', 'otro'
  provider: text('provider'), // 'nic.py', 'Hosting Paraguay', 'Render', 'Microsoft', 'Google Play', etc.
  billing: jsonb('billing').$type<{
    responsibility: 'tc_cliente' | 'tc_agencia' | 'transferencia' | 'incluido' | 'otro';
    cycle?: 'monthly' | 'annual' | 'one_off' | 'free';
    cost?: number;
    currency?: 'PYG' | 'USD';
    renewalDate?: string;
    notes?: string;
  }>(),
  relationships: jsonb('relationships').$type<Array<{
    targetName: string;
    type: 'depends_on' | 'points_to' | 'hosts' | 'connects_to' | 'unlinked';
  }>>(),
  roadmapNotes: text('roadmap_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const uptimePings = pgTable('uptime_pings', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  checkedAt: timestamp('checked_at').defaultNow(),
  statusCode: integer('status_code'),
  responseTimeMs: integer('response_time_ms'),
  isUp: boolean('is_up').notNull(),
  errorMessage: text('error_message'),
});

export const uptimeDailyRollup = pgTable('uptime_daily_rollup', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  totalChecks: integer('total_checks').notNull(),
  successfulChecks: integer('successful_checks').notNull(),
  uptimePercentage: doublePrecision('uptime_percentage').notNull(),
  avgResponseTimeMs: integer('avg_response_time_ms').notNull(),
  minResponseTimeMs: integer('min_response_time_ms'),
  maxResponseTimeMs: integer('max_response_time_ms'),
  incidentCount: integer('incident_count').default(0),
});

export const configTemplates = pgTable('config_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'security', 'cache', 'branding', 'widgets'
  description: text('description'),
  configType: text('config_type').notNull(), // 'wp_options', 'file', 'manual'
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  periodMonth: text('period_month').notNull(), // 'YYYY-MM'
  totalVisits: integer('total_visits').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  bounceRate: text('bounce_rate'),
  topPages: jsonb('top_pages'),
  topReferrers: jsonb('top_referrers'),
  deviceBreakdown: jsonb('device_breakdown'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
});

export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: text('key').unique().notNull(), // 'telegram_config', 'branding', 'global_token'
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  siteId: integer('site_id').references(() => sites.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  status: text('status').notNull(), // 'success', 'failed', 'running'
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type UptimePing = typeof uptimePings.$inferSelect;
export type ConfigTemplate = typeof configTemplates.$inferSelect;
