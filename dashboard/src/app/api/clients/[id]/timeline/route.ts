import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.title || !body.year) {
      return NextResponse.json(
        { error: 'Título y año son obligatorios para registrar un hito en la línea de tiempo.' },
        { status: 400 }
      );
    }

    const updatedClient = await dataService.addClientTimelineEvent(parseInt(id, 10), {
      year: body.year,
      date: body.date,
      title: body.title,
      description: body.description || '',
      category: body.category || 'milestone',
      actor: body.actor || 'rodney',
    });

    if (!updatedClient) {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updatedClient, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
