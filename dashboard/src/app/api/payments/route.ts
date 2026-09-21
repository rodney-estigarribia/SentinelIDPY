import { NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');
    const year = searchParams.get('year') || undefined;
    const month = searchParams.get('month') || undefined;
    const status = searchParams.get('status') || undefined;

    const clientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

    const payments = await dataService.getPayments({ clientId, year, month, status });
    return NextResponse.json(payments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.amount || !body.date || !body.concept) {
      return NextResponse.json(
        { error: 'Monto, fecha y concepto son obligatorios para registrar un pago.' },
        { status: 400 }
      );
    }

    const created = await dataService.createPayment({
      clientId: body.clientId ? Number(body.clientId) : null,
      projectId: body.projectId ? Number(body.projectId) : null,
      amount: Number(body.amount),
      currency: body.currency || 'PYG',
      date: body.date,
      concept: body.concept,
      description: body.description || null,
      paymentMethod: body.paymentMethod || 'transferencia',
      receiptNumber: body.receiptNumber || null,
      status: body.status || 'completed',
      notes: body.notes || null,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
