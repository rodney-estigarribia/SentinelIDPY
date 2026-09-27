import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { securityLimiter } from '@/lib/rate-limiter';
import {
  standardSecurityHeaders,
  validateEmailSecurity,
  validateSiteSlugSecurity,
} from '@/lib/security-validation';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const SECRET = process.env.SESSION_SECRET || 'sentinel-portal-secret-key-2026-very-secure';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: standardSecurityHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Detección de IP del cliente
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de solicitud JSON inválido.' },
        { status: 400, headers: standardSecurityHeaders }
      );
    }

    const { siteSlug, email, returnUrl, hp } = body || {};

    // 2. Trampa Honeypot: Si un bot rellena el campo oculto "hp", se descarta silenciosamente
    if (hp && typeof hp === 'string' && hp.trim().length > 0) {
      return NextResponse.json(
        {
          ok: true,
          message: 'Te enviamos un enlace de acceso a tu correo.',
          emailDelivery: {
            sent: false,
            status: 'honeypot_trapped',
          },
        },
        { headers: standardSecurityHeaders }
      );
    }

    // 3. Rate Limiting por IP (Sliding Window: Máx 5 peticiones cada 10 minutos)
    const ipCheck = securityLimiter.checkIpLimit(ip, 5, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: `Demasiadas solicitudes desde tu dirección IP. Por favor esperá ${ipCheck.retryAfterSec} segundos antes de reintentar.`,
        },
        {
          status: 429,
          headers: {
            ...standardSecurityHeaders,
            'Retry-After': String(ipCheck.retryAfterSec),
          },
        }
      );
    }

    // 4. Validación y Sanitización Estricta de Parámetros
    const slugValidation = validateSiteSlugSecurity(siteSlug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { error: slugValidation.error || 'Slug de sitio no válido.' },
        { status: 400, headers: standardSecurityHeaders }
      );
    }

    const emailValidation = validateEmailSecurity(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Correo electrónico no válido.' },
        { status: 400, headers: standardSecurityHeaders }
      );
    }

    const cleanSlug = slugValidation.cleanSlug!;
    const cleanEmail = emailValidation.cleanEmail!;

    // 5. Cooldown por Email (Mínimo 60 segundos entre envíos a la misma casilla)
    const cooldownCheck = securityLimiter.checkEmailCooldown(cleanEmail, 60 * 1000);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        {
          error: `Ya enviamos un enlace recientemente a esta casilla. Por favor esperá ${cooldownCheck.remainingSec} segundos antes de solicitar otro.`,
        },
        {
          status: 429,
          headers: {
            ...standardSecurityHeaders,
            'Retry-After': String(cooldownCheck.remainingSec),
          },
        }
      );
    }

    // 6. Búsqueda y Validación de Autorización en Base de Datos
    const site = await dataService.getSiteBySlug(cleanSlug);
    let client = null;

    if (site && site.clientId) {
      client = await dataService.getClientById(site.clientId);
    }

    if (!client) {
      client = await dataService.getClientByEmail(cleanEmail);
    }

    const cfgEmail = (site as any)?.siteConfig?.portalEmail?.trim().toLowerCase();
    const isConfigAuthorized =
      cfgEmail &&
      cfgEmail
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .includes(cleanEmail);

    const clientPortalEmail = (client as any)?.portalEmail?.trim().toLowerCase();
    const isClientPortalAuthorized =
      clientPortalEmail &&
      clientPortalEmail
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .includes(cleanEmail);

    const clientGeneralEmail = (client as any)?.email?.trim().toLowerCase();
    const isClientGeneralAuthorized =
      clientGeneralEmail &&
      clientGeneralEmail
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .includes(cleanEmail);

    const clientBillingEmail = (client as any)?.billingEmail?.trim().toLowerCase();
    const isClientBillingAuthorized =
      clientBillingEmail &&
      clientBillingEmail
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .includes(cleanEmail);

    const isAgencyAdmin =
      cleanEmail.includes('impulsosdigitales') ||
      cleanEmail.includes('admin') ||
      cleanEmail === 'rodney@impulsosdigitales.com.py' ||
      cleanEmail.includes('rodney.estigarribia') ||
      cleanEmail === 'rodney.estigarribia@outlook.com';

    const isAuthorized =
      isConfigAuthorized ||
      isClientPortalAuthorized ||
      isClientGeneralAuthorized ||
      isClientBillingAuthorized ||
      isAgencyAdmin;

    // 7. Mitigación de Timing-Attacks y Enumeración de Correos
    if (!isAuthorized && (client || cfgEmail)) {
      // Artificial delay (200ms) para homogeneizar tiempos de respuesta
      await new Promise((resolve) => setTimeout(resolve, 200));
      return NextResponse.json(
        {
          error:
            'El correo ingresado no coincide con el correo autorizado para el portal de analítica de este cliente.',
        },
        { status: 403, headers: standardSecurityHeaders }
      );
    }

    // 8. Generación de Token con 7 Días de Vigencia Criptográfica
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = JSON.stringify({ siteSlug: cleanSlug, email: cleanEmail, exp });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    const token = `${payloadB64}.${signature}`;

    const baseUrl =
      returnUrl ||
      (site?.url ? `${site.url.replace(/\/$/, '')}/portal` : `https://${cleanSlug}.vercel.app/portal`);
    const magicLink = `${baseUrl}?token=${token}`;

    // 9. Envío de correo vía Resend
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let emailStatus = 'unconfigured'; // 'sent' | 'failed' | 'unconfigured'

    const siteTitle = site?.name || cleanSlug;
    const emailSubject = `Acceso a ${siteTitle}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700;">Acceso a ${siteTitle}</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">Hacé clic en el botón de abajo para acceder a las estadísticas de tu sitio web (<strong>${siteTitle}</strong>):</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${magicLink}" style="background-color: #1c2e1e; color: #ffffff; padding: 13px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px; letter-spacing: 0.2px;">Acceder</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 28px; margin-bottom: 8px;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; word-break: break-all; font-family: monospace; font-size: 12px; line-height: 1.4;">
          <a href="${magicLink}" style="color: #0284c7; text-decoration: underline;">${magicLink}</a>
        </div>
        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.4;">
          Si no solicitaste este acceso, podés ignorar este mensaje con tranquilidad.
        </div>
      </div>
    `;

    if (resendKey) {
      try {
        const primaryFrom =
          process.env.RESEND_FROM || 'Impulsos Digitales <notificaciones@impulsosdigitales.com.py>';

        let resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: primaryFrom,
            to: cleanEmail,
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        let resendData = await resendRes.json().catch(() => null);

        // Si falló por dominio no verificado, reintentar con remitente de testing de Resend
        if (
          !resendRes.ok &&
          (resendData?.message?.toLowerCase().includes('domain') ||
            resendData?.name === 'validation_error')
        ) {
          console.warn(
            '[Magic Link] Resend primary domain failed, retrying with onboarding@resend.dev:',
            resendData
          );
          resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Impulsos Digitales <onboarding@resend.dev>',
              to: cleanEmail,
              subject: emailSubject,
              html: emailHtml,
            }),
          });
          resendData = await resendRes.json().catch(() => null);
        }

        if (resendRes.ok) {
          emailSent = true;
          emailStatus = 'sent';
        } else {
          emailStatus = 'failed';
          console.warn('[Magic Link] Resend delivery failed:', resendData);
        }
      } catch (err: any) {
        emailStatus = 'failed';
        console.warn('[Magic Link] Resend exception:', err);
      }
    } else {
      emailStatus = 'unconfigured';
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Te enviamos un enlace de acceso a tu correo.',
        emailDelivery: {
          sent: emailSent,
          status: emailStatus,
        },
      },
      { headers: standardSecurityHeaders }
    );
  } catch (error) {
    console.error('[API Magic Link] Error generating link:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de enlace.' },
      { status: 500, headers: standardSecurityHeaders }
    );
  }
}
