import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isNum = !isNaN(parseInt(id, 10)) && !id.includes('-');
    let site = isNum ? await dataService.getSiteById(parseInt(id, 10)) : await dataService.getSiteBySlug(id);
    if (!site && isNum) {
      site = await dataService.getSiteBySlug(id);
    }

    const slug = (site as any)?.siteConfig?.slug || (site?.url ? site.url.replace(/https?:\/\//, '').split('.')[0] : id);
    const isCabana = slug === 'cabana-del-arbol';
    const isBought = slug === 'don-mendoza' || slug === 'terrazas-bungalow';
    const isAlquimia = slug === 'alquimia-cafe';

    const defaultPhone = isCabana
      ? '595982957509'
      : isAlquimia
      ? '595971688400'
      : slug === 'don-mendoza'
      ? '595981438296'
      : '595981000000';

    const defaultMsg = isCabana
      ? '¡Hola! Quisiera consultar disponibilidad en Cabaña del Árbol.'
      : isAlquimia
      ? '¡Hola Alquimia Café! Estuve viendo su web y quisiera hacerles una consulta. ☕'
      : slug === 'don-mendoza'
      ? 'Hola Don Mendoza, quisiera consultar disponibilidad para un diagnóstico técnico en mi piscina.'
      : '¡Hola! Quisiera consultar disponibilidad en Terrazas Bungalow.';

    if (!site) {
      return NextResponse.json({
        slug,
        demo: { active: !isBought, startDate: new Date().toISOString().split('T')[0], days: 7 },
        proposal: { active: isCabana || isAlquimia },
        whatsapp: {
          phone: defaultPhone,
          defaultMessage: defaultMsg
        },
        pricing: {}
      }, { headers: corsHeaders });
    }

    const config = (site as any).siteConfig || {
      slug,
      demo: { active: !isBought, startDate: new Date().toISOString().split('T')[0], days: 7 },
      proposal: { active: isCabana || isAlquimia },
      whatsapp: {
        phone: defaultPhone,
        defaultMessage: defaultMsg
      },
      pricing: {}
    };

    if (config.proposal === undefined) {
      config.proposal = { active: isCabana || isAlquimia };
    }

    return NextResponse.json(config, { headers: corsHeaders });
  } catch (error) {
    console.error('[API Site Config GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const isNum = !isNaN(parseInt(id, 10)) && !id.includes('-');
    let site = isNum ? await dataService.getSiteById(parseInt(id, 10)) : await dataService.getSiteBySlug(id);
    if (!site && isNum) {
      site = await dataService.getSiteBySlug(id);
    }

    if (!site) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404, headers: corsHeaders });
    }

    const currentConfig = (site as any).siteConfig || {};
    const slug = (site as any).siteConfig?.slug || id;
    const updatedConfig = { ...currentConfig, ...body, slug, updatedAt: new Date().toISOString() };

    await dataService.updateSite(site.id, {
      siteConfig: updatedConfig
    } as any);

    return NextResponse.json({ ok: true, config: updatedConfig }, { headers: corsHeaders });
  } catch (error) {
    console.error('[API Site Config PATCH] Error:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500, headers: corsHeaders });
  }
}
