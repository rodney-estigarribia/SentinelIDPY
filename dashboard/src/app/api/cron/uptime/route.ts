import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient } from '@/lib/sentinel-wp-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify Vercel Cron authorization header or secret if present
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sites = await dataService.getSites();
  const results = [];

  for (const site of sites) {
    const ping = await sentinelWpClient.pingSite(site.url);

    // Update site status
    await dataService.updateSite(site.id, {
      status: ping.isUp ? 'online' : 'offline',
      lastStatusCode: ping.statusCode,
      lastResponseTimeMs: ping.responseTimeMs,
      lastCheckedAt: new Date(),
    });

    // If site is down and Telegram is configured, dispatch alert
    if (!ping.isUp) {
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;

      if (telegramToken && telegramChatId) {
        try {
          const message = `🚨 <b>ALERTA DE CAÍDA — SentinelIDPY</b>\n\nEl sitio <b>${site.name}</b> (${site.url}) no responde.\nCódigo HTTP: <code>${ping.statusCode || 'Timeout'}</code>\nError: ${ping.error || 'Sin respuesta'}`;
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: message,
              parse_mode: 'HTML'
            })
          });
        } catch (e) {
          console.warn('Failed to send telegram alert:', e);
        }
      }
    }

    results.push({
      siteId: site.id,
      name: site.name,
      url: site.url,
      ...ping
    });
  }

  return NextResponse.json({
    status: 'ok',
    checkedCount: sites.length,
    timestamp: new Date().toISOString(),
    results
  });
}
