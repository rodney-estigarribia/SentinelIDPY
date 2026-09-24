import type { Metadata } from 'next';
import { dataService } from '@/lib/data-service';
import { PortalClient } from './portal-client';

interface PortalPageProps {
  params: Promise<{ slug: string }>;
}

const KNOWN_SLUGS: Record<string, { name: string; subtitle?: string }> = {
  'cabana-del-arbol': {
    name: 'Cabaña del Árbol',
    subtitle: 'Métricas de visitas y reservas para La Cabaña'
  },
  'terrazas-bungalow': {
    name: 'Terrazas Bungalow',
    subtitle: 'Métricas de visitas y cotizaciones para Terrazas Bungalow'
  },
  'don-mendoza': {
    name: 'Don Mendoza Piscinas',
    subtitle: 'Métricas de visitas y consultas de limpieza de piscinas'
  },
};

function formatSlugName(slug: string): string {
  if (KNOWN_SLUGS[slug]) return KNOWN_SLUGS[slug].name;
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PortalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await dataService.getSiteBySlug(slug).catch(() => undefined);
  const siteName = site?.name || formatSlugName(slug);

  return {
    title: `${siteName} · Portal de Estadísticas`,
    description: `Portal privado de telemetría y rendimiento para ${siteName}. Impulsos Digitales.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ClientPortalPage({ params }: PortalPageProps) {
  const { slug } = await params;
  const site = await dataService.getSiteBySlug(slug).catch(() => undefined);
  const client = site?.clientId ? await dataService.getClientById(site.clientId).catch(() => undefined) : undefined;

  const siteName = site?.name || client?.name || formatSlugName(slug);
  const subtitle = KNOWN_SLUGS[slug]?.subtitle || `Métricas reales y consultas directas a WhatsApp para ${siteName}`;

  return (
    <PortalClient
      siteSlug={slug}
      siteName={siteName}
      subtitle={subtitle}
      siteUrl={site?.url}
    />
  );
}
