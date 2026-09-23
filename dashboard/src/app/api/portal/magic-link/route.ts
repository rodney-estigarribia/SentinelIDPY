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

    // Validación: El correo debe coincidir con el cliente registrado (o permitir al admin de la agencia)
    const isOwner = client && client.email && client.email.trim().toLowerCase() === cleanEmail;
    const isAgencyAdmin = cleanEmail.includes('impulsosdigitales') || cleanEmail.includes('admin');

    if (!isOwner && !isAgencyAdmin && client) {
      return NextResponse.json(
        { error: 'El correo ingresado no coincide con el titular registrado de este sitio.' },
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
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Impulsos Digitales <notificaciones@impulsosdigitales.com.py>',
            to: cleanEmail,
            subject: `Tu enlace de acceso a las estadísticas de ${site?.name || siteSlug}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a; margin-top: 0;">Portal de Clientes · Impulsos Digitales</h2>
                <p style="color: #475569; font-size: 15px;">Hacé clic en el siguiente botón para acceder a las estadísticas de tu sitio web. Tu sesión permanecerá activa de forma segura por <strong>7 días</strong>:</p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${magicLink}" style="background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Ver Estadísticas de mi Web</a>
                </div>
                <p style="color: #94a3b8; font-size: 12px;">Si no solicitaste este acceso, podés ignorar este correo. Este enlace expirará automáticamente en 7 días.</p>
              </div>
            `
          })
        });
      } catch (err) {
        console.warn('[Magic Link] Resend email dispatch failed:', err);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Enlace mágico generado con éxito.',
        expiresInDays: 7,
        magicLink, // Incluido para pruebas inmediatas y previsualización
        token
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[API Magic Link] Error generating link:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de enlace.' }, { status: 500, headers: corsHeaders });
  }
}
