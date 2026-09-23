import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
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
  ClientTimelineEvent,
  SiteEvent,
  NewSiteEvent
} from '@/db/schema';
import {
  INITIAL_CLIENTS,
  INITIAL_SITES,
  INITIAL_TEMPLATES,
  INITIAL_SERVICE_GROUPS,
  INITIAL_PROJECTS,
  INITIAL_PAYMENTS,
  DEFAULT_FINANCIAL_SETTINGS
} from './initial-data';
import { ensureDbSchema } from './ensure-db';

// Fallback in-memory stores (in case DB is offline or not configured)
let memoryClients = [...INITIAL_CLIENTS];
let memorySites = [...INITIAL_SITES];
const memoryTemplates = [...INITIAL_TEMPLATES];
let memoryServiceGroups = [...INITIAL_SERVICE_GROUPS];
let memoryProjects = [...INITIAL_PROJECTS];
let memoryPayments = [...INITIAL_PAYMENTS];
let memoryFinancialSettings = { ...DEFAULT_FINANCIAL_SETTINGS };
let memorySiteEvents: SiteEvent[] = [];

// Ultra-fast in-memory cache for snappy navigation between pages
// Cache TTL is 30 seconds; invalidated immediately upon any write/mutation
const CACHE_TTL = 30_000;

interface CacheEntry<T> {
  data: T;
  time: number;
}

interface CacheStore {
  clients: CacheEntry<Client[]> | null;
  sites: CacheEntry<Site[]> | null;
  projects: CacheEntry<Project[]> | null;
  payments: CacheEntry<Payment[]> | null;
  serviceGroups: CacheEntry<ServiceGroup[]> | null;
  templates: CacheEntry<ConfigTemplate[]> | null;
  financialSettings: CacheEntry<typeof DEFAULT_FINANCIAL_SETTINGS> | null;
}

const entityCache: CacheStore & { invalidate: (key?: keyof CacheStore) => void } = {
  clients: null,
  sites: null,
  projects: null,
  payments: null,
  serviceGroups: null,
  templates: null,
  financialSettings: null,

  invalidate(key?: keyof CacheStore) {
    if (key) {
      entityCache[key] = null;
    } else {
      entityCache.clients = null;
      entityCache.sites = null;
      entityCache.projects = null;
      entityCache.payments = null;
      entityCache.serviceGroups = null;
      entityCache.templates = null;
      entityCache.financialSettings = null;
    }
  }
};

export const dataService = {
  invalidateCache(key?: keyof CacheStore) {
    entityCache.invalidate(key);
  },

  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    if (entityCache.clients && Date.now() - entityCache.clients.time < CACHE_TTL) {
      return entityCache.clients.data;
    }
    await ensureDbSchema();
    if (db) {
      try {
        const rows = await db.select().from(schema.clients);
        entityCache.clients = { data: rows, time: Date.now() };
        return rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryClients;
  },

  async getClientById(id: number): Promise<Client | undefined> {
    const clients = await this.getClients();
    return clients.find((c) => c.id === id);
  },

  async createClient(data: NewClient): Promise<Client> {
    entityCache.invalidate('clients');
    await ensureDbSchema();
    if (db) {
      try {
        const [created] = await db.insert(schema.clients).values(data).returning();
        if (created) {
          memoryClients.push(created);
          return created;
        }
      } catch (err) {
        console.error('DB insert failed, using memory store:', err);
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
      clientType: data.clientType || 'real',
      servicePackage: data.servicePackage || 'custom',
      billingEmail: data.billingEmail || null,
      portalEmail: data.portalEmail || null,
      billingDetails: data.billingDetails || null,
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
    entityCache.invalidate('clients');
    await ensureDbSchema();
    if (db) {
      try {
        const [updated] = await db.update(schema.clients)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.clients.id, id))
          .returning();
        if (updated) {
          const index = memoryClients.findIndex((c) => c.id === id);
          if (index !== -1) memoryClients[index] = updated;
          return updated;
        }
      } catch (err) {
        console.error('DB update failed, using memory store:', err);
      }
    }
    const index = memoryClients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    memoryClients[index] = { ...memoryClients[index], ...data, updatedAt: new Date() };
    return memoryClients[index];
  },

  async deleteClient(id: number): Promise<boolean> {
    entityCache.invalidate('clients');
    entityCache.invalidate('sites');
    await ensureDbSchema();
    if (db) {
      try {
        await db.delete(schema.clients).where(eq(schema.clients.id, id));
        memoryClients = memoryClients.filter((c) => c.id !== id);
        memorySites = memorySites.filter((s) => s.clientId !== id);
        return true;
      } catch (err) {
        console.error('DB delete failed, using memory store:', err);
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
    let allSites: Site[] = entityCache.sites?.data || [];
    if (!entityCache.sites || Date.now() - entityCache.sites.time >= CACHE_TTL) {
      await ensureDbSchema();
      if (db) {
        try {
          allSites = await db.select().from(schema.sites);
          entityCache.sites = { data: allSites, time: Date.now() };
        } catch (err) {
          console.warn('DB Query failed, falling back to memory store:', err);
          allSites = memorySites;
        }
      } else {
        allSites = memorySites;
      }
    }

    let result: Site[] = allSites.length > 0 ? allSites : memorySites;
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
    const sites = await this.getSites({ includeArchived: true });
    return sites.find((s) => s.id === id);
  },

  async createSite(data: NewSite): Promise<Site> {
    entityCache.invalidate('sites');
    await ensureDbSchema();
    if (db) {
      try {
        const [created] = await db.insert(schema.sites).values(data).returning();
        if (created) {
          memorySites.push(created);
          return created;
        }
      } catch (err) {
        console.error('DB insert failed, using memory store:', err);
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
      siteConfig: (data as any).siteConfig || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memorySites.push(newSite);
    return newSite;
  },

  async updateSite(id: number, data: Partial<Site>): Promise<Site | null> {
    entityCache.invalidate('sites');
    await ensureDbSchema();
    if (db) {
      try {
        const [updated] = await db.update(schema.sites)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.sites.id, id))
          .returning();
        if (updated) {
          const index = memorySites.findIndex((s) => s.id === id);
          if (index !== -1) memorySites[index] = updated;
          return updated;
        }
      } catch (err) {
        console.error('DB update failed, using memory store:', err);
      }
    }
    const index = memorySites.findIndex((s) => s.id === id);
    if (index === -1) return null;
    memorySites[index] = { ...memorySites[index], ...data, updatedAt: new Date() };
    return memorySites[index];
  },

  async deleteSite(id: number): Promise<boolean> {
    entityCache.invalidate('sites');
    // Soft delete: Mark site as 'archived' so it is excluded from active queries
    const updated = await this.updateSite(id, { status: 'archived' });
    return !!updated;
  },

  // --- TEMPLATES ---
  async getTemplates(): Promise<ConfigTemplate[]> {
    if (entityCache.templates && Date.now() - entityCache.templates.time < CACHE_TTL) {
      return entityCache.templates.data;
    }
    await ensureDbSchema();
    if (db) {
      try {
        const rows = await db.select().from(schema.configTemplates);
        entityCache.templates = { data: rows, time: Date.now() };
        return rows;
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryTemplates;
  },

  async getTemplateById(id: number): Promise<ConfigTemplate | undefined> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.id === id);
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
    let allGroups: ServiceGroup[] = entityCache.serviceGroups?.data || [];
    if (!entityCache.serviceGroups || Date.now() - entityCache.serviceGroups.time >= CACHE_TTL) {
      await ensureDbSchema();
      if (db) {
        try {
          allGroups = await db.select().from(schema.serviceGroups);
          entityCache.serviceGroups = { data: allGroups, time: Date.now() };
        } catch (err) {
          console.warn('DB Query failed, falling back to memory store:', err);
          allGroups = memoryServiceGroups;
        }
      } else {
        allGroups = memoryServiceGroups;
      }
    }

    const result: ServiceGroup[] = allGroups.length > 0 ? allGroups : memoryServiceGroups;
    if (clientId) {
      return result.filter((g) => g.clientId === clientId);
    }
    return result;
  },

  async getServiceGroupById(id: number): Promise<ServiceGroup | undefined> {
    const groups = await this.getServiceGroups();
    return groups.find((g) => g.id === id);
  },

  async createServiceGroup(data: NewServiceGroup): Promise<ServiceGroup> {
    entityCache.invalidate('serviceGroups');
    await ensureDbSchema();
    if (db) {
      try {
        const [created] = await db.insert(schema.serviceGroups).values(data).returning();
        if (created) {
          memoryServiceGroups.push(created);
          return created;
        }
      } catch (err) {
        console.error('DB insert failed, using memory store:', err);
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
    entityCache.invalidate('serviceGroups');
    entityCache.invalidate('sites');
    await ensureDbSchema();
    const existing = await this.getServiceGroupById(id);
    if (!existing) return null;
    const oldName = existing.name;

    if (db) {
      try {
        const [updated] = await db.update(schema.serviceGroups)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.serviceGroups.id, id))
          .returning();
        if (updated) {
          if (data.name && data.name !== oldName) {
            // Cascade update services with matching group
            await db.update(schema.sites)
              .set({ serviceGroup: data.name })
              .where(eq(schema.sites.clientId, existing.clientId));
          }
          const index = memoryServiceGroups.findIndex((g) => g.id === id);
          if (index !== -1) memoryServiceGroups[index] = updated;
          return updated;
        }
      } catch (err) {
        console.error('DB update failed, using memory store:', err);
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
    entityCache.invalidate('serviceGroups');
    entityCache.invalidate('sites');
    await ensureDbSchema();
    const existing = await this.getServiceGroupById(id);
    if (!existing) return false;

    if (db) {
      try {
        await db.delete(schema.serviceGroups).where(eq(schema.serviceGroups.id, id));
        memoryServiceGroups = memoryServiceGroups.filter((g) => g.id !== id);
        return true;
      } catch (err) {
        console.error('DB delete failed, using memory store:', err);
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
    let allProjects: Project[] = entityCache.projects?.data || [];
    if (!entityCache.projects || Date.now() - entityCache.projects!.time >= CACHE_TTL) {
      await ensureDbSchema();
      if (db) {
        try {
          allProjects = await db.select().from(schema.projects);
          entityCache.projects = { data: allProjects, time: Date.now() };
        } catch (err) {
          console.warn('DB Query failed, falling back to memory store:', err);
          allProjects = memoryProjects;
        }
      } else {
        allProjects = memoryProjects;
      }
    }

    let result: Project[] = allProjects.length > 0 ? allProjects : memoryProjects;
    if (filters?.clientId) {
      result = result.filter((p) => p.clientId === filters.clientId);
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    return result;
  },

  async getProjectById(id: number): Promise<Project | undefined> {
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id);
  },

  async createProject(data: NewProject): Promise<Project> {
    entityCache.invalidate('projects');
    await ensureDbSchema();
    if (db) {
      try {
        const [created] = await db.insert(schema.projects).values(data).returning();
        if (created) {
          memoryProjects.push(created);
          return created;
        }
      } catch (err) {
        console.error('DB insert failed, using memory store:', err);
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
    entityCache.invalidate('projects');
    await ensureDbSchema();
    if (db) {
      try {
        const [updated] = await db.update(schema.projects)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.projects.id, id))
          .returning();
        if (updated) {
          const index = memoryProjects.findIndex((p) => p.id === id);
          if (index !== -1) memoryProjects[index] = updated;
          return updated;
        }
      } catch (err) {
        console.error('DB update failed, using memory store:', err);
      }
    }
    const index = memoryProjects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    memoryProjects[index] = { ...memoryProjects[index], ...data, updatedAt: new Date() };
    return memoryProjects[index];
  },

  async deleteProject(id: number): Promise<boolean> {
    entityCache.invalidate('projects');
    await ensureDbSchema();
    if (db) {
      try {
        await db.delete(schema.projects).where(eq(schema.projects.id, id));
        memoryProjects = memoryProjects.filter((p) => p.id !== id);
        return true;
      } catch (err) {
        console.error('DB delete failed, using memory store:', err);
      }
    }
    const initialLen = memoryProjects.length;
    memoryProjects = memoryProjects.filter((p) => p.id !== id);
    return memoryProjects.length < initialLen;
  },

  // --- PAYMENTS & FINANCES ---
  async getPayments(filters?: { clientId?: number; year?: string; month?: string; status?: string }): Promise<Payment[]> {
    let allPayments: Payment[] = entityCache.payments?.data || [];
    if (!entityCache.payments || Date.now() - entityCache.payments!.time >= CACHE_TTL) {
      await ensureDbSchema();
      if (db) {
        try {
          allPayments = await db.select().from(schema.payments);
          entityCache.payments = { data: allPayments, time: Date.now() };
        } catch (err) {
          console.warn('DB Query failed, falling back to memory store:', err);
          allPayments = memoryPayments;
        }
      } else {
        allPayments = memoryPayments;
      }
    }

    let result: Payment[] = allPayments.length > 0 ? allPayments : memoryPayments;
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
    const payments = await this.getPayments();
    return payments.find((p) => p.id === id);
  },

  async createPayment(data: NewPayment): Promise<Payment> {
    entityCache.invalidate('payments');
    entityCache.invalidate('projects');
    await ensureDbSchema();
    let created: Payment | null = null;
    if (db) {
      try {
        const [row] = await db.insert(schema.payments).values(data).returning();
        created = row;
      } catch (err) {
        console.error('DB insert failed, using memory store:', err);
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
    }
    memoryPayments.unshift(created);

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
    entityCache.invalidate('payments');
    entityCache.invalidate('projects');
    await ensureDbSchema();
    if (db) {
      try {
        const [updated] = await db.update(schema.payments)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.payments.id, id))
          .returning();
        if (updated) {
          const index = memoryPayments.findIndex((p) => p.id === id);
          if (index !== -1) memoryPayments[index] = updated;
          return updated;
        }
      } catch (err) {
        console.error('DB update failed, using memory store:', err);
      }
    }
    const index = memoryPayments.findIndex((p) => p.id === id);
    if (index === -1) return null;
    memoryPayments[index] = { ...memoryPayments[index], ...data, updatedAt: new Date() };
    return memoryPayments[index];
  },

  async deletePayment(id: number): Promise<boolean> {
    entityCache.invalidate('payments');
    entityCache.invalidate('projects');
    await ensureDbSchema();
    if (db) {
      try {
        await db.delete(schema.payments).where(eq(schema.payments.id, id));
        memoryPayments = memoryPayments.filter((p) => p.id !== id);
        return true;
      } catch (err) {
        console.error('DB delete failed, using memory store:', err);
      }
    }
    const initialLen = memoryPayments.length;
    memoryPayments = memoryPayments.filter((p) => p.id !== id);
    return memoryPayments.length < initialLen;
  },

  async getFinancialSettings() {
    if (entityCache.financialSettings && Date.now() - entityCache.financialSettings.time < CACHE_TTL) {
      return entityCache.financialSettings.data;
    }
    await ensureDbSchema();
    if (db) {
      try {
        const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'salary_ladder_config'));
        if (row && row.value) {
          const val = row.value as typeof DEFAULT_FINANCIAL_SETTINGS;
          entityCache.financialSettings = { data: val, time: Date.now() };
          return val;
        }
      } catch (err) {
        console.warn('DB Query failed, falling back to memory store:', err);
      }
    }
    return memoryFinancialSettings;
  },

  async updateFinancialSettings(settings: Partial<typeof DEFAULT_FINANCIAL_SETTINGS>) {
    entityCache.invalidate('financialSettings');
    await ensureDbSchema();
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
        console.error('DB insert/update failed, using memory store:', err);
      }
    }
    memoryFinancialSettings = updated;
    return memoryFinancialSettings;
  },

  // --- TRACKER & CLIENT PORTAL ---
  async recordSiteEvent(data: NewSiteEvent): Promise<SiteEvent> {
    await ensureDbSchema();
    if (db) {
      try {
        const [inserted] = await db.insert(schema.siteEvents).values(data).returning();
        if (inserted) return inserted;
      } catch (err) {
        console.error('Failed to insert siteEvent into DB, using memory:', err);
      }
    }
    const memEvent: SiteEvent = {
      id: Math.floor(Math.random() * 1000000),
      siteSlug: data.siteSlug,
      eventType: data.eventType,
      path: data.path || '/',
      referrer: data.referrer || null,
      country: data.country || null,
      city: data.city || null,
      device: data.device || 'desktop',
      visitorHash: data.visitorHash || null,
      metadata: data.metadata || null,
      createdAt: new Date(),
    };
    memorySiteEvents.push(memEvent);
    return memEvent;
  },

  async getSiteEvents(siteSlug: string, days = 30): Promise<SiteEvent[]> {
    await ensureDbSchema();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.siteEvents)
          .where(eq(schema.siteEvents.siteSlug, siteSlug))
          .orderBy(desc(schema.siteEvents.createdAt));
        return rows.filter((r) => r.createdAt && new Date(r.createdAt) >= since);
      } catch (err) {
        console.warn('Failed to query siteEvents from DB, falling back to memory:', err);
      }
    }
    return memorySiteEvents.filter(
      (e) => e.siteSlug === siteSlug && e.createdAt && new Date(e.createdAt) >= since
    );
  },

  async getSiteBySlug(slug: string): Promise<Site | undefined> {
    const allSites = await this.getSites({ includeArchived: true });
    return allSites.find((s) => {
      const config = (s as any).siteConfig;
      if (config && config.slug === slug) return true;
      if (s.url && s.url.includes(slug)) return true;
      const cleanName = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return cleanName === slug;
    });
  },

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const allClients = await this.getClients();
    const cleanEmail = email.trim().toLowerCase();
    return allClients.find((c) => c.email && c.email.trim().toLowerCase() === cleanEmail);
  },

  isDatabaseConnected(): boolean {
    return Boolean(db);
  }
};
