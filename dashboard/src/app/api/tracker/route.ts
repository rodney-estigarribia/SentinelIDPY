import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import crypto from 'node:crypto';

// CORS Headers para permitir llamadas desde las webs de los clientes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    let body;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }

    const { siteSlug, eventType, path = '/', referrer = '', metadata = null } = body || {};

    if (!siteSlug || !eventType) {
      return NextResponse.json({ error: 'Missing siteSlug or eventType' }, { status: 400, headers: corsHeaders });
    }

    // Extraer geolocalización nativa de borde de Vercel (100% gratuita)
    const country = req.headers.get('x-vercel-ip-country') || 'PY';
    const rawCity = req.headers.get('x-vercel-ip-city') || 'Asunción';
    const city = decodeURIComponent(rawCity);

    // Detectar tipo de dispositivo
    const userAgent = req.headers.get('user-agent') || '';
    let device = 'desktop';
    if (/tablet|ipad/i.test(userAgent)) {
      device = 'tablet';
    } else if (/mobile|android|iphone/i.test(userAgent)) {
      device = 'mobile';
    }

    // Hash anónimo de visitante único por día (sin almacenar IPs)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const today = new Date().toISOString().split('T')[0];
    const visitorHash = crypto.createHash('sha256').update(`${ip}-${today}-${siteSlug}`).digest('hex').slice(0, 16);

    await dataService.recordSiteEvent({
      siteSlug,
      eventType: eventType === 'whatsapp_click' ? 'whatsapp_click' : 'pageview',
      path,
      referrer,
      country,
      city,
      device,
      visitorHash,
      metadata: metadata || null,
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('[API Tracker] Error recording event:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500, headers: corsHeaders });
  }
}
