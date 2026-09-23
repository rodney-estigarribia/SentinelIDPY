import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const site = await dataService.getSiteBySlug(slug);

    if (!site) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404, headers: corsHeaders });
    }

    const config = (site as any).siteConfig || {
      slug,
      demo: { active: true, startDate: new Date().toISOString().split('T')[0], days: 7 },
      whatsapp: { phone: '595981000000', defaultMessage: '¡Hola! Quisiera consultar disponibilidad...' },
      pricing: {}
    };

    return NextResponse.json(config, { headers: corsHeaders });
  } catch (error) {
    console.error('[API Site Config GET] Error:', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const site = await dataService.getSiteBySlug(slug);

    if (!site) {
      return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404, headers: corsHeaders });
    }

    const currentConfig = (site as any).siteConfig || {};
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
