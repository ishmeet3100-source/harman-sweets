import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, receipt } = await request.json();
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      return NextResponse.json({ error: 'A valid amount is required.' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay is not configured yet.' }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(numericAmount * 100),
        currency: 'INR',
        receipt: receipt || `harman_${Date.now()}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.description || 'Unable to create order.' }, { status: response.status });
    }

    return NextResponse.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch {
    return NextResponse.json({ error: 'Unable to create payment order.' }, { status: 500 });
  }
}
