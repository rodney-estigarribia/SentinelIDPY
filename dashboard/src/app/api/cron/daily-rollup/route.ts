import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { sql, lt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let prunedCount = 0;

  if (db) {
    try {
      // 1. Rollup yesterday's pings into daily summary
      await db.execute(sql`
        INSERT INTO uptime_daily_rollup (site_id, date, total_checks, successful_checks, uptime_percentage, avg_response_time_ms, incident_count)
        SELECT 
          site_id,
          DATE(checked_at) as date,
          COUNT(*) as total_checks,
          COUNT(*) FILTER (WHERE is_up = true) as successful_checks,
          ROUND((COUNT(*) FILTER (WHERE is_up = true)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) as uptime_percentage,
          ROUND(AVG(response_time_ms)) as avg_response_time_ms,
          COUNT(*) FILTER (WHERE is_up = false) as incident_count
        FROM uptime_pings
        WHERE checked_at < CURRENT_DATE AND checked_at >= CURRENT_DATE - INTERVAL '1 day'
        GROUP BY site_id, DATE(checked_at)
        ON CONFLICT DO NOTHING;
      `);

      // 2. Prune detailed raw pings older than 30 days to keep DB size under ~30 MB forever
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleteRes = await db
        .delete(schema.uptimePings)
        .where(lt(schema.uptimePings.checkedAt, thirtyDaysAgo));

      prunedCount = (deleteRes as any)?.rowCount || 0;
    } catch (err) {
      console.warn('Daily rollup failed:', err);
    }
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Daily rollup completed and pings pruned',
    prunedCount,
    timestamp: new Date().toISOString()
  });
}
