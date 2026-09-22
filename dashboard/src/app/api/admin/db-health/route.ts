import { NextResponse } from 'next/server';
import { ensureDbSchema } from '@/lib/ensure-db';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    return NextResponse.json({
      status: 'unconfigured',
      message: 'No DATABASE_URL or POSTGRES_URL found in environment variables. Running in ephemeral memory mode.',
      isDbConnected: false,
    });
  }

  try {
    const initialized = await ensureDbSchema();
    const sql = neon(connectionString);

    const [clientsCount] = await sql`SELECT COUNT(*)::int as count FROM clients`;
    const [sitesCount] = await sql`SELECT COUNT(*)::int as count FROM sites`;
    const [groupsCount] = await sql`SELECT COUNT(*)::int as count FROM service_groups`;
    const [projectsCount] = await sql`SELECT COUNT(*)::int as count FROM projects`;
    const [paymentsCount] = await sql`SELECT COUNT(*)::int as count FROM payments`;
    const [templatesCount] = await sql`SELECT COUNT(*)::int as count FROM config_templates`;
    const [settingsCount] = await sql`SELECT COUNT(*)::int as count FROM app_settings`;

    return NextResponse.json({
      status: 'connected',
      isDbConnected: true,
      autoInitialized: initialized,
      connectionSource: process.env.DATABASE_URL ? 'DATABASE_URL' : 'POSTGRES_URL',
      tables: {
        clients: clientsCount.count,
        sites: sitesCount.count,
        service_groups: groupsCount.count,
        projects: projectsCount.count,
        payments: paymentsCount.count,
        config_templates: templatesCount.count,
        app_settings: settingsCount.count,
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      isDbConnected: false,
      error: err.message,
    }, { status: 500 });
  }
}
