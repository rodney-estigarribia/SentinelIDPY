import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await dataService.getFinancialSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await dataService.updateFinancialSettings(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
