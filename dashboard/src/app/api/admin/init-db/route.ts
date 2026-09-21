import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    return NextResponse.json(
      { error: 'No DATABASE_URL or POSTGRES_URL found in environment variables.' },
      { status: 500 }
    );
  }

  try {
    const sql = neon(connectionString);

    // 1. Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        notes TEXT,
        infrastructure JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
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

    // 2. Check if clients exist, if not seed them from initial data
    const existingClients = await sql`SELECT COUNT(*)::int as count FROM clients`;
    let seeded = false;

    if (existingClients[0].count === 0) {
      const memoryClients = await dataService.getClients();
      for (const client of memoryClients) {
        await sql`
          INSERT INTO clients (id, name, email, phone, company, notes, infrastructure)
          VALUES (${client.id}, ${client.name}, ${client.email}, ${client.phone}, ${client.company}, ${client.notes}, ${JSON.stringify(client.infrastructure)})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      // Reset sequence
      await sql`SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));`;

      // Seed sites
      const memorySites = await dataService.getSites();
      for (const site of memorySites) {
        await sql`
          INSERT INTO sites (
            id, client_id, name, type, url, token, disk_allocated_gb, status,
            last_status_code, last_response_time_ms, last_checked_at, last_backup_at,
            wp_version, php_version, ssl_days_left, site_health_score, pending_updates,
            wordfence_stats, performance_info, metadata, category, provider, billing,
            relationships, roadmap_notes, service_group
          ) VALUES (
            ${site.id}, ${site.clientId}, ${site.name}, ${site.type}, ${site.url}, ${site.token},
            ${site.diskAllocatedGb}, ${site.status}, ${site.lastStatusCode}, ${site.lastResponseTimeMs},
            ${site.lastCheckedAt ? new Date(site.lastCheckedAt).toISOString() : null},
            ${site.lastBackupAt ? new Date(site.lastBackupAt).toISOString() : null},
            ${site.wpVersion}, ${site.phpVersion}, ${site.sslDaysLeft},
            ${site.siteHealthScore ? JSON.stringify(site.siteHealthScore) : null},
            ${site.pendingUpdates ? JSON.stringify(site.pendingUpdates) : null},
            ${site.wordfenceStats ? JSON.stringify(site.wordfenceStats) : null},
            ${site.performanceInfo ? JSON.stringify(site.performanceInfo) : null},
            ${site.metadata ? JSON.stringify(site.metadata) : null},
            ${site.category}, ${site.provider},
            ${site.billing ? JSON.stringify(site.billing) : null},
            ${site.relationships ? JSON.stringify(site.relationships) : null},
            ${site.roadmapNotes}, ${site.serviceGroup}
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }

      await sql`SELECT setval('sites_id_seq', (SELECT MAX(id) FROM sites));`;
      seeded = true;
    }

    // 3. Actualizar tokens reales y limpiar datos mock antiguos de actualizaciones en sitios WordPress
    const realToken =
      process.env.WF_REPORT_TOKEN ||
      '905f4c6ec85e34726dd33b787535874217a05ce5e3f430b27afaaf34c839ab6895d197be1dfd13ebd433233998213ea85e6d4dd6fed20a76854a60bc8ba3516f';

    await sql`
      UPDATE sites
      SET token = ${realToken}
      WHERE type = 'wordpress' AND (token IS NULL OR LENGTH(token) < 32 OR token = 'a1b2c3d4e5f67890123456789abcdef0');
    `;

    await sql`
      UPDATE sites
      SET pending_updates = '{"plugins": 0, "themes": 0, "wordpress": 0, "details": []}'::jsonb
      WHERE type = 'wordpress' AND (
        pending_updates->>'details' IS NOT NULL AND
        pending_updates->'details'->0->>'slug' IN ('wordfence', 'elementor', 'woocommerce', 'wp-rocket')
      );
    `;

    return NextResponse.json({
      success: true,
      message: seeded
        ? 'Base de datos inicializada y poblada con datos de clientes exitosamente.'
        : 'Base de datos sincronizada: tokens de seguridad actualizados y estado de actualizaciones limpiado.',
    });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: error.message || 'Error al inicializar la base de datos' },
      { status: 500 }
    );
  }
}
