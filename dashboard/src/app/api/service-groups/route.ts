import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') ? parseInt(searchParams.get('clientId')!, 10) : undefined;

  const groups = await dataService.getServiceGroups(clientId);
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.clientId) {
      return NextResponse.json({ error: 'name and clientId are required' }, { status: 400 });
    }
    const created = await dataService.createServiceGroup({
      clientId: Number(body.clientId),
      name: body.name.trim(),
      description: body.description?.trim() || null,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
