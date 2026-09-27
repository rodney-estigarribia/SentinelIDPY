import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { securityLimiter } from '@/lib/rate-limiter';
import { standardSecurityHeaders, validateSiteSlugSecurity } from '@/lib/security-validation';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: standardSecurityHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Rate limiting de ingesta: Máx 120 eventos por minuto por IP para evitar spamming
    if (!securityLimiter.checkTrackerLimit(ip, 120, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Límite de telemetría excedido temporalmente.' },
        { status: 429, headers: standardSecurityHeaders }
      );
    }

    let body: any;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }

    const { siteSlug, eventType, path = '/', referrer = '', metadata = null } = body || {};

    if (!siteSlug || !eventType) {
      return NextResponse.json(
        { error: 'Missing siteSlug or eventType' },
        { status: 400, headers: standardSecurityHeaders }
      );
    }

    const slugCheck = validateSiteSlugSecurity(siteSlug);
    if (!slugCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid siteSlug format' },
        { status: 400, headers: standardSecurityHeaders }
      );
    }
    const cleanSlug = slugCheck.cleanSlug!;

    // 2. Extraer geolocalización nativa de borde de Vercel
    const country = req.headers.get('x-vercel-ip-country') || 'PY';
    const rawCity = req.headers.get('x-vercel-ip-city') || 'Asunción';
    const city = decodeURIComponent(rawCity).slice(0, 80);

    // 3. Detectar tipo de dispositivo
    const userAgent = req.headers.get('user-agent') || '';
    let device = 'desktop';
    if (/tablet|ipad/i.test(userAgent)) {
      device = 'tablet';
    } else if (/mobile|android|iphone/i.test(userAgent)) {
      device = 'mobile';
    }

    // 4. Hash anónimo con sal criptográfica diaria (privacidad estricta sin almacenar IPs)
    const today = new Date().toISOString().split('T')[0];
    const visitorHash = crypto
      .createHash('sha256')
      .update(`${ip}-${today}-${cleanSlug}`)
      .digest('hex')
      .slice(0, 16);

    // 5. Sanitizar parámetros de longitud
    const cleanPath = typeof path === 'string' ? path.slice(0, 255) : '/';
    const cleanReferrer = typeof referrer === 'string' ? referrer.slice(0, 500) : '';

    await dataService.recordSiteEvent({
      siteSlug: cleanSlug,
      eventType: eventType === 'whatsapp_click' ? 'whatsapp_click' : 'pageview',
      path: cleanPath,
      referrer: cleanReferrer,
      country,
      city,
      device,
      visitorHash,
      metadata: metadata || null,
    });

    return NextResponse.json({ ok: true }, { headers: standardSecurityHeaders });
  } catch (error) {
    console.error('[API Tracker] Error recording event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500, headers: standardSecurityHeaders }
    );
  }
}
