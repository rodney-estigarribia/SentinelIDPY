import { NextResponse } from 'next/server';
import { ensureDbSchema } from '@/lib/ensure-db';
import { dataService } from '@/lib/data-service';

export const revalidate = 0;

export async function GET() {
  return handleSync();
}

export async function POST() {
  return handleSync();
}

async function handleSync() {
  try {
    // 1. Force database auto-migration and seed upsert
    await ensureDbSchema(true);
    dataService.invalidateCache();

    // 2. Fetch fresh synchronized datasets
    const [clients, sites] = await Promise.all([
      dataService.getClients(),
      dataService.getSites(),
    ]);

    const newClients = clients.filter(c => [15, 16, 17].includes(c.id));
    const newSites = sites.filter(s => [11, 12, 13].includes(s.id));

    return NextResponse.json({
      success: true,
      message: 'Catálogo sincronizado exitosamente con la base de datos',
      totalClients: clients.length,
      totalSites: sites.length,
      targetClients: newClients.map(c => ({
        id: c.id,
        name: c.name,
        legalName: c.legalName,
        type: (c as any).clientType,
        package: (c as any).servicePackage,
        portalEmail: (c as any).portalEmail,
      })),
      targetSites: newSites.map(s => ({
        id: s.id,
        clientId: s.clientId,
        name: s.name,
        url: s.url,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al sincronizar catálogo',
      },
      { status: 500 }
    );
  }
}
