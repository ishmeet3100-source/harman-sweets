'use client';

import { useMemo, useState } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentOptions({ amount = 499 }: { amount?: number }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'yourupi@bank';
  const upiName = process.env.NEXT_PUBLIC_UPI_NAME || 'Harman Sweets';
  const upiLink = useMemo(
    () => `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`,
    [amount, upiId, upiName],
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;

  async function payWithRazorpay() {
    setMessage('Opening secure checkout…');
    const loaded = await loadRazorpayScript();
    if (!loaded) return setMessage('Could not load Razorpay. Please try again.');

    const orderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt: `harman_${Date.now()}` }),
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok) return setMessage(order.error || 'Could not start payment.');

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Harman Sweets',
      description: 'Harman Sweets order payment',
      order_id: order.orderId,
      prefill: { name, contact: phone },
      theme: { color: '#68152a' },
      handler: async (response: Record<string, string>) => {
        const verification = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        });
        const result = await verification.json();
        setMessage(result.verified ? 'Payment verified. Thank you for ordering from Harman Sweets!' : 'Payment could not be verified. Please contact us.');
      },
      modal: { ondismiss: () => setMessage('Payment window closed.') },
    });
    checkout.open();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="card pad">
        <span className="tag">Secure online payment</span>
        <h2 style={{ fontSize: 32, marginBottom: 12 }}>Pay for your order</h2>
        <p>Pay securely with UPI, cards, net banking, or wallets using Razorpay.</p>
        <div className="grid gap-3" style={{ marginTop: 18 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Your name" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" aria-label="Phone number" />
          <div className="amount">Amount: <b>₹{amount}</b></div>
          <button className="btn primary" onClick={payWithRazorpay}>Pay securely with Razorpay</button>
          {message && <p role="status">{message}</p>}
        </div>
      </div>
      <div className="card pad" style={{ textAlign: 'center' }}>
        <span className="tag">UPI QR payment</span>
        <h3 style={{ marginTop: 12 }}>Scan to pay ₹{amount}</h3>
        <img src={qrUrl} alt="Harman Sweets UPI payment QR code" width="240" height="240" style={{ margin: '18px auto', display: 'block' }} />
        <p style={{ fontSize: 13 }}>UPI ID: <b>{upiId}</b></p>
        <a className="btn outline" href={upiLink}>Open in UPI app</a>
      </div>
    </div>
  );
}
