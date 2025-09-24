import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">
        Lixie Payment Iframe - Mercantil
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/payment/tdc" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Tarjeta de Crédito</h2>
          <p>Procesar pago con TDC</p>
        </Link>
        
        <Link href="/payment/tdd" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Tarjeta de Débito</h2>
          <p>Procesar pago con TDD</p>
        </Link>
        
        <Link href="/payment/pago-movil" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Pago Móvil</h2>
          <p>Procesar pago móvil</p>
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Para integrar en Odoo/ERP:</h3>
        <code className="text-sm bg-black text-white p-2 rounded">
          {`<iframe src="https://tu-dominio.com/payment/tdc?data=ENCODED_DATA" width="400" height="500"></iframe>`}
        </code>
      </div>
    </main>
  );
}