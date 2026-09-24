import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import crypto from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SECRET = process.env.SESSION_SECRET || 'sentinel-portal-secret-key-2026-very-secure';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { siteSlug, email, returnUrl } = await req.json();

    if (!siteSlug || !email) {
      return NextResponse.json(
        { error: 'Debe proporcionar el slug del sitio y un correo electrónico válido.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const site = await dataService.getSiteBySlug(siteSlug);
    let client = null;

    if (site && site.clientId) {
      client = await dataService.getClientById(site.clientId);
    }

    // Si no se encuentra cliente por site.clientId, buscar directamente por email
    if (!client) {
      client = await dataService.getClientByEmail(cleanEmail);
    }

    // Validación: El correo debe coincidir con portalEmail, email de cliente, facturación, o ser admin de la agencia
    const cfgEmail = (site as any)?.siteConfig?.portalEmail?.trim().toLowerCase();
    const isConfigAuthorized = cfgEmail && cfgEmail.split(',').map((e: string) => e.trim().toLowerCase()).includes(cleanEmail);

    const clientPortalEmail = (client as any)?.portalEmail?.trim().toLowerCase();
    const isClientPortalAuthorized = clientPortalEmail && clientPortalEmail.split(',').map((e: string) => e.trim().toLowerCase()).includes(cleanEmail);

    const clientGeneralEmail = (client as any)?.email?.trim().toLowerCase();
    const isClientGeneralAuthorized = clientGeneralEmail && clientGeneralEmail.split(',').map((e: string) => e.trim().toLowerCase()).includes(cleanEmail);

    const clientBillingEmail = (client as any)?.billingEmail?.trim().toLowerCase();
    const isClientBillingAuthorized = clientBillingEmail && clientBillingEmail.split(',').map((e: string) => e.trim().toLowerCase()).includes(cleanEmail);

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

    if (!isAuthorized && (client || cfgEmail)) {
      return NextResponse.json(
        { error: 'El correo ingresado no coincide con el correo autorizado para el portal de analítica de este cliente.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Generar Token con 7 Días de Vigencia (604,800,000 ms)
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = JSON.stringify({ siteSlug, email: cleanEmail, exp });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    const token = `${payloadB64}.${signature}`;

    const baseUrl = returnUrl || (site?.url ? `${site.url.replace(/\/$/, '')}/portal` : `https://${siteSlug}.vercel.app/portal`);
    const magicLink = `${baseUrl}?token=${token}`;

    // Envío por correo vía Resend si existe la clave de API
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;
    let emailStatus = 'unconfigured'; // 'sent' | 'failed' | 'unconfigured'
    let emailError: string | null = null;

    if (resendKey) {
      try {
        const primaryFrom = process.env.RESEND_FROM || 'Impulsos Digitales <notificaciones@impulsosdigitales.com.py>';

        let resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: primaryFrom,
            to: cleanEmail,
            subject: `Tu enlace de acceso a las estadísticas de ${site?.name || siteSlug}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Portal de Clientes · Impulsos Digitales</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hacé clic en el botón de abajo para acceder a las estadísticas de tu sitio web (<strong>${site?.name || siteSlug}</strong>). Tu sesión permanecerá activa de forma segura por <strong>7 días</strong>:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}" style="background-color: #0284c7; color: white; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">Ver Estadísticas de mi Web</a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.4;">Si no solicitaste este acceso, podés ignorar este mensaje con tranquilidad. Este enlace expirará automáticamente en 7 días.</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
                  Impulsos Digitales · Infraestructura Cloud & Analítica
                </div>
              </div>
            `
          })
        });

        let resendData = await resendRes.json().catch(() => null);

        // Si falló por dominio no verificado, reintentar con remitente de testing de Resend
        if (!resendRes.ok && (resendData?.message?.toLowerCase().includes('domain') || resendData?.name === 'validation_error')) {
          console.warn('[Magic Link] Resend primary domain failed, retrying with onboarding@resend.dev:', resendData);
          resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Impulsos Digitales <onboarding@resend.dev>',
              to: cleanEmail,
              subject: `Tu enlace de acceso a las estadísticas de ${site?.name || siteSlug}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Portal de Clientes · Impulsos Digitales</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.5;">Hacé clic en el botón de abajo para acceder a las estadísticas de tu sitio web (<strong>${site?.name || siteSlug}</strong>). Tu sesión permanecerá activa de forma segura por <strong>7 días</strong>:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${magicLink}" style="background-color: #0284c7; color: white; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">Ver Estadísticas de mi Web</a>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; line-height: 1.4;">Si no solicitaste este acceso, podés ignorar este mensaje con tranquilidad. Este enlace expirará automáticamente en 7 días.</p>
                </div>
              `
            })
          });
          resendData = await resendRes.json().catch(() => null);
        }

        if (resendRes.ok) {
          emailSent = true;
          emailStatus = 'sent';
        } else {
          emailStatus = 'failed';
          emailError = resendData?.message || `HTTP ${resendRes.status}`;
          console.warn('[Magic Link] Resend delivery failed:', resendData);
        }
      } catch (err: any) {
        emailStatus = 'failed';
        emailError = err.message || 'Error de conexión con Resend';
        console.warn('[Magic Link] Resend exception:', err);
      }
    } else {
      emailStatus = 'unconfigured';
      emailError = 'Variable RESEND_API_KEY no configurada en Vercel';
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Te enviamos un enlace de acceso a tu correo.',
        emailDelivery: {
          sent: emailSent,
          status: emailStatus
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[API Magic Link] Error generating link:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de enlace.' }, { status: 500, headers: corsHeaders });
  }
}
