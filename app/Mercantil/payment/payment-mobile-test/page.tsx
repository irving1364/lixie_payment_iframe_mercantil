'use client';
import { useState } from 'react';
import PaymentMobilePayment from '@/components/payment/PaymentMobilePayment';
import { PaymentMobileClientData } from '@/lib/types/payment-mobile';

export default function PaymentMobileTestPage() {
  const [clientData] = useState<PaymentMobileClientData>({
    encryptedClient: "pXsM1bjazk/Gc7ASLqJLje4Hc8VR3MPD4Q+D8t46NMvTnPDDCz3ItgPpOby/5Rop",
    encryptedMerchant: "JZb38y6vm/CKkGvZ2i+rxQ==",
    encryptedKey: "l7GpQTyXBWnym0Q9mmATdwzisIqCSZlFPbkFs9azdmM=",
    invoiceNumber: "TEST-PM-" + Date.now().toString().slice(-6),
    amount: 50.00,
    description: "Pago de prueba - Mobile Payment"
  });

  const handlePaymentSuccess = (result: any) => {
    console.log('✅ Pago exitoso:', result);
    alert('¡Pago exitoso! Revisa la consola para más detalles.');
  };

  const handlePaymentError = (message: string) => {
    console.error('❌ Error en pago:', message);
    alert('Error: ' + message);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">🧪 Prueba de Payment Mobile</h1>
        <PaymentMobilePayment 
          PaymentMobileClientData={clientData}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          embedded={false}
          mode="standalone"
        />
      </div>
    </div>
  );
}