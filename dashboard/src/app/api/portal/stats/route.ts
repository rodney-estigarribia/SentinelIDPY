import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import crypto from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SECRET = process.env.SESSION_SECRET || 'sentinel-portal-secret-key-2026-very-secure';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteSlug = searchParams.get('siteSlug');
    const token = searchParams.get('token') || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!siteSlug || !token) {
      return NextResponse.json({ error: 'Falta siteSlug o token de autenticación.' }, { status: 401, headers: corsHeaders });
    }

    // 1. Validar Token HMAC y Expiración
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) {
      return NextResponse.json({ error: 'Formato de token inválido.' }, { status: 401, headers: corsHeaders });
    }

    const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Firma de token inválida o adulterada.' }, { status: 403, headers: corsHeaders });
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || Date.now() > payload.exp) {
      return NextResponse.json({ error: 'Tu enlace de acceso ha expirado. Por favor solicitá uno nuevo.' }, { status: 401, headers: corsHeaders });
    }

    if (payload.siteSlug !== siteSlug) {
      return NextResponse.json({ error: 'El token no corresponde a este sitio web.' }, { status: 403, headers: corsHeaders });
    }

    // 2. Extraer eventos de los últimos 30 días
    const events = await dataService.getSiteEvents(siteSlug, 30);
    const site = await dataService.getSiteBySlug(siteSlug);

    let pageviews = 0;
    let whatsappClicks = 0;
    const visitorHashes = new Set<string>();
    const citiesMap: Record<string, number> = {};
    const deviceMap = { mobile: 0, desktop: 0, tablet: 0 };
    const dailyMap: Record<string, { date: string; pageviews: number; whatsappClicks: number; visitors: Set<string> }> = {};

    // Inicializar los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyMap[d] = { date: d, pageviews: 0, whatsappClicks: 0, visitors: new Set() };
    }

    for (const ev of events) {
      const day = ev.createdAt ? new Date(ev.createdAt).toISOString().split('T')[0] : '';
      if (ev.eventType === 'pageview') {
        pageviews++;
        if (ev.visitorHash) visitorHashes.add(ev.visitorHash);
        if (dailyMap[day]) {
          dailyMap[day].pageviews++;
          if (ev.visitorHash) dailyMap[day].visitors.add(ev.visitorHash);
        }
      } else if (ev.eventType === 'whatsapp_click') {
        whatsappClicks++;
        if (dailyMap[day]) dailyMap[day].whatsappClicks++;
      }

      if (ev.city && ev.city !== 'unknown') {
        citiesMap[ev.city] = (citiesMap[ev.city] || 0) + 1;
      }

      const dev = (ev.device || 'desktop') as 'mobile' | 'desktop' | 'tablet';
      if (deviceMap[dev] !== undefined) deviceMap[dev]++;
    }

    const topCities = Object.entries(citiesMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dailyStats = Object.values(dailyMap).map(d => ({
      date: d.date,
      pageviews: d.pageviews,
      whatsappClicks: d.whatsappClicks,
      uniqueVisitors: d.visitors.size
    }));

    const daysRemaining = Math.max(0, Math.ceil((payload.exp - Date.now()) / (24 * 60 * 60 * 1000)));

    return NextResponse.json({
      siteName: site?.name || siteSlug,
      siteUrl: site?.url || '',
      summary: {
        totalPageviews: pageviews,
        uniqueVisitors: visitorHashes.size,
        whatsappClicks: whatsappClicks,
        conversionRate: pageviews > 0 ? Number(((whatsappClicks / pageviews) * 100).toFixed(1)) : 0
      },
      topCities,
      devices: deviceMap,
      daily: dailyStats,
      session: {
        email: payload.email,
        expiresInDays: daysRemaining
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[API Portal Stats] Error fetching stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas.' }, { status: 500, headers: corsHeaders });
  }
}
