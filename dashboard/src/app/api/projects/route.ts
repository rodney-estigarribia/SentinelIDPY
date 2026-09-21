import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const statusParam = searchParams.get('status') || undefined;

    const clientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

    const projects = await dataService.getProjects({ clientId, status: statusParam });
    return NextResponse.json(projects);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const created = await dataService.createProject(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
