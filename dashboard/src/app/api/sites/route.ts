import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const clientId = searchParams.get('clientId') ? parseInt(searchParams.get('clientId')!, 10) : undefined;

  const sites = await dataService.getSites({ type, clientId });
  return NextResponse.json(sites);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newSite = await dataService.createSite(body);
    return NextResponse.json(newSite, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
