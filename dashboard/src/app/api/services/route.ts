import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const clientId = searchParams.get('clientId') ? parseInt(searchParams.get('clientId')!, 10) : undefined;

  const services = await dataService.getServices({ type, clientId });
  return NextResponse.json(services);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newService = await dataService.createService(body);
    return NextResponse.json(newService, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
