import { neon } from '@neondatabase/serverless';

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export async function ensureDbSchema(): Promise<boolean> {
  if (isInitialized) return true;
  if (initPromise) return initPromise;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    return false;
  }

  initPromise = (async () => {
    try {
      const sql = neon(connectionString);

      // Fast-path: Check if database is already fully initialized in a single quick query
      try {
        const check = await sql`SELECT 1 FROM app_settings WHERE key = 'salary_ladder_config' LIMIT 1;`;
        if (check && check.length > 0) {
          isInitialized = true;
          return true;
        }
      } catch {
        // Table doesn't exist yet, continue to full auto-migration below
      }

      // 1. Create and update all tables if not exists
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
        category TEXT,
        provider TEXT,
        billing JSONB,
        relationships JSONB,
        roadmap_notes TEXT,
        service_group TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      ALTER TABLE sites 
      ADD COLUMN IF NOT EXISTS category TEXT,
      ADD COLUMN IF NOT EXISTS provider TEXT,
      ADD COLUMN IF NOT EXISTS billing JSONB,
      ADD COLUMN IF NOT EXISTS relationships JSONB,
      ADD COLUMN IF NOT EXISTS roadmap_notes TEXT,
      ADD COLUMN IF NOT EXISTS service_group TEXT;
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
        category TEXT NOT NULL DEFAULT 'security',
        description TEXT,
        config_type TEXT NOT NULL DEFAULT 'wp_options',
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        type TEXT DEFAULT 'security',
        settings JSONB,
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

    // 2. Check if clients table is empty, seed if empty
    const clientCount = await sql`SELECT COUNT(*)::int as count FROM clients`;
    if (clientCount[0].count === 0) {
      const { INITIAL_CLIENTS } = await import('@/lib/initial-data');
      for (const c of INITIAL_CLIENTS) {
        await sql`
          INSERT INTO clients (
            id, name, legal_name, ruc, email, phone, company, notes,
            status, acquisition_channel, drive_folder_url, timeline, infrastructure
          ) VALUES (
            ${c.id}, ${c.name}, ${c.legalName || null}, ${c.ruc || null}, ${c.email || null}, ${c.phone || null}, ${c.company || null}, ${c.notes || null},
            ${c.status || 'active'}, ${c.acquisitionChannel || 'direct'}, ${c.driveFolderUrl || null}, ${JSON.stringify(c.timeline || [])}, ${JSON.stringify(c.infrastructure || {})}
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }
      await sql`SELECT setval('clients_id_seq', (SELECT GREATEST(MAX(id), 1) FROM clients));`;
    }

    // 3. Check if sites table is empty, seed if empty
    const siteCount = await sql`SELECT COUNT(*)::int as count FROM sites`;
    if (siteCount[0].count === 0) {
      const { INITIAL_SITES } = await import('@/lib/initial-data');
      for (const s of INITIAL_SITES) {
        await sql`
          INSERT INTO sites (
            id, client_id, name, type, url, token, disk_allocated_gb,
            status, last_status_code, last_response_time_ms, last_checked_at, last_backup_at,
            wp_version, php_version, ssl_days_left, site_health_score, pending_updates,
            wordfence_stats, performance_info, metadata, category, provider, billing, relationships, roadmap_notes, service_group
          ) VALUES (
            ${s.id}, ${s.clientId}, ${s.name}, ${s.type}, ${s.url}, ${s.token}, ${s.diskAllocatedGb},
            ${s.status}, ${s.lastStatusCode}, ${s.lastResponseTimeMs}, ${s.lastCheckedAt ? new Date(s.lastCheckedAt) : null}, ${s.lastBackupAt ? new Date(s.lastBackupAt) : null},
            ${s.wpVersion}, ${s.phpVersion}, ${s.sslDaysLeft}, ${JSON.stringify(s.siteHealthScore || {})}, ${JSON.stringify(s.pendingUpdates || {})},
            ${JSON.stringify(s.wordfenceStats || {})}, ${JSON.stringify(s.performanceInfo || {})}, ${JSON.stringify(s.metadata || {})}, ${s.category}, ${s.provider},
            ${JSON.stringify(s.billing || {})}, ${JSON.stringify(s.relationships || {})}, ${s.roadmapNotes || null}, ${s.serviceGroup}
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }
      await sql`SELECT setval('sites_id_seq', (SELECT GREATEST(MAX(id), 1) FROM sites));`;
    }

    // 3.1 Auto-heal updates to match MainWP (12 updates: 5 plugins, 7 translations)
    try {
      const site1 = await sql`SELECT pending_updates FROM sites WHERE id = 1 LIMIT 1;`;
      const p1 = site1[0]?.pending_updates as { details?: unknown[] } | undefined;
      if (!p1 || !p1.details || p1.details.length === 0) {
        const { INITIAL_SITES } = await import('@/lib/initial-data');
        for (const sId of [1, 4, 6, 10]) {
          const freshSite = INITIAL_SITES.find((s) => s.id === sId);
          if (freshSite && freshSite.pendingUpdates) {
            await sql`
              UPDATE sites 
              SET pending_updates = ${JSON.stringify(freshSite.pendingUpdates)}
              WHERE id = ${sId};
            `;
          }
        }
      }
    } catch {
      // non-blocking
    }

    // 4. Check if service_groups is empty, seed if empty
    const groupCount = await sql`SELECT COUNT(*)::int as count FROM service_groups`;
    if (groupCount[0].count === 0) {
      const { INITIAL_SERVICE_GROUPS } = await import('@/lib/initial-data');
      for (const g of INITIAL_SERVICE_GROUPS) {
        await sql`
          INSERT INTO service_groups (id, client_id, name, description)
          VALUES (${g.id}, ${g.clientId}, ${g.name}, ${g.description || null})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      await sql`SELECT setval('service_groups_id_seq', (SELECT GREATEST(MAX(id), 1) FROM service_groups));`;
    }

    // 5. Check if projects is empty, seed if empty
    const projCount = await sql`SELECT COUNT(*)::int as count FROM projects`;
    if (projCount[0].count === 0) {
      const { INITIAL_PROJECTS } = await import('@/lib/initial-data');
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

    // 6. Check if payments is empty, seed if empty
    const payCount = await sql`SELECT COUNT(*)::int as count FROM payments`;
    if (payCount[0].count === 0) {
      const { INITIAL_PAYMENTS } = await import('@/lib/initial-data');
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

    // 7. Check if config_templates is empty, seed if empty
    const tplCount = await sql`SELECT COUNT(*)::int as count FROM config_templates`;
    if (tplCount[0].count === 0) {
      const { INITIAL_TEMPLATES } = await import('@/lib/initial-data');
      for (const t of INITIAL_TEMPLATES) {
        await sql`
          INSERT INTO config_templates (id, name, category, description, config_type, payload)
          VALUES (
            ${t.id}, ${t.name}, ${t.category}, ${t.description || null}, ${t.configType}, ${JSON.stringify(t.payload || {})}
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }
      await sql`SELECT setval('config_templates_id_seq', (SELECT GREATEST(MAX(id), 1) FROM config_templates));`;
    }

    // 8. Check if app_settings has salary_ladder_config
    const { DEFAULT_FINANCIAL_SETTINGS } = await import('@/lib/initial-data');
    await sql`
      INSERT INTO app_settings (key, value)
      VALUES ('salary_ladder_config', ${JSON.stringify(DEFAULT_FINANCIAL_SETTINGS)})
      ON CONFLICT (key) DO NOTHING;
    `;

    isInitialized = true;
    return true;
  } catch (err) {
    console.error('❌ [ensureDbSchema] Error during auto-initialization:', err);
    initPromise = null;
    return false;
  }
  })();

  return initPromise;
}
