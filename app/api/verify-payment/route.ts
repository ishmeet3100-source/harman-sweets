import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Missing payment verification data.' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const verified = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8'),
    );

    return NextResponse.json({ verified }, { status: verified ? 200 : 400 });
  } catch {
    return NextResponse.json({ verified: false, error: 'Payment verification failed.' }, { status: 400 });
  }
}
