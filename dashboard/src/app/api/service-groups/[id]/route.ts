import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const group = await dataService.getServiceGroupById(parseInt(id, 10));
  if (!group) return NextResponse.json({ error: 'Service group not found' }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await dataService.updateServiceGroup(parseInt(id, 10), body);
    if (!updated) return NextResponse.json({ error: 'Service group not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await dataService.deleteServiceGroup(parseInt(id, 10));
  if (!deleted) return NextResponse.json({ error: 'Service group not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
