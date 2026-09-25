import PaymentOptions from '@/components/PaymentOptions';

export default function PaymentPage() {
  return <main><section><div className="wrap"><span className="tag">Harman Sweets checkout</span><h1 style={{ fontSize: 54 }}>Choose your payment method.</h1><p>Use Razorpay checkout or scan our UPI QR code. For order details, contact +91 94075 00095.</p><PaymentOptions amount={499} /></div></section></main>;
}
