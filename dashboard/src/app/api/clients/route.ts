import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clients = await dataService.getClients();
    return NextResponse.json(clients);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newClient = await dataService.createClient(body);
    return NextResponse.json(newClient, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
