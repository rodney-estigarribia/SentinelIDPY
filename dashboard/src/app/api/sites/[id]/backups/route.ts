import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';
import { sentinelWpClient } from '@/lib/sentinel-wp-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteId = parseInt(id, 10);
  const site = await dataService.getSiteById(siteId);

  if (!site) return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  if (site.type !== 'wordpress') {
    return NextResponse.json({ error: 'Solo aplica a sitios WordPress' }, { status: 400 });
  }

  const token = site.token || process.env.WF_REPORT_TOKEN || 'a1b2c3d4e5f67890123456789abcdef0';

  try {
    const res = await sentinelWpClient.runBackup(site.url, token);

    if (res.status === 'error') {
      await dataService.logActivity(siteId, 'backup_run', 'failed', { error: res.message });
      return NextResponse.json(
        { error: res.message || 'Error al ejecutar respaldo en WordPress' },
        { status: 500 }
      );
    }

    await dataService.logActivity(siteId, 'backup_run', 'success', { message: res.message });

    return NextResponse.json({
      success: true,
      message: res.message || 'Copia de seguridad iniciada con éxito en WordPress',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
