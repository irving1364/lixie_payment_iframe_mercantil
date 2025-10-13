'use client';
import { useEffect, useState } from 'react';
import { ClientData, PaymentRequest, PaymentResponse } from '@/lib/types';
import { PaymentApi } from '@/lib/api/api';

interface TdcPaymentProps {
  clientData: ClientData;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';
type IdType = 'V' | 'E' | 'J';

export default function TdcPayment({ clientData, onSuccess, onError, embedded = false, mode = 'standalone' }: TdcPaymentProps) {

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [idType, setIdType] = useState<IdType>('V');
  const [idNumber, setIdNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(clientData.invoiceNumber || clientData.orderId || '');
  const [responseMessage, setResponseMessage] = useState('');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [rawRequestData, setRawRequestData] = useState<any>(null);
  const [rawResponseData, setRawResponseData] = useState<any>(null);

  // Extraer customerId existente si viene del clientData
  useEffect(() => {
    if (clientData.customerId && typeof clientData.customerId === 'string') {
      // Intentar parsear el customerId existente para prellenar los campos
      const match = clientData.customerId.match(/^([VEJ])(\d+)$/);
      if (match) {
        setIdType(match[1] as IdType);
        setIdNumber(match[2]);
      } else {
        // Si no coincide el patrón, usar valor por defecto
        setIdType('V');
        // Asegurarse de que solo tome números
        const numbersOnly = clientData.customerId.replace(/[^0-9]/g, '');
        setIdNumber(numbersOnly);
      }
    } else {
      // Si no hay customerId o no es string, usar valores por defecto
      setIdType('V');
      setIdNumber('');
    }
  }, [clientData.customerId]); // Dependencia del effect

  // Funciones de formateo
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpirationDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length > 4) {
      return cleaned.slice(0, 4) + '/' + cleaned.slice(4);
    }
    return cleaned;
  };

  const convertToApiDateFormat = (displayDate: string): string => {
    const cleaned = displayDate.replace(/\D/g, '');
    if (cleaned.length === 6) {
      return cleaned.slice(0, 4) + '/' + cleaned.slice(4);
    }
    return displayDate;
  };

  // Función para unir tipo y número de cédula
  const buildCustomerId = (type: IdType, number: string): string => {
    return `${type}${number}`;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('loading');
    setResponseMessage('');
    setRawResponseData(null);

    try {
      // Validaciones básicas del frontend
      if (!cardNumber || !cvv || !expirationDate || !idNumber || !invoiceNumber) {
        throw new Error('Por favor complete todos los campos');
      }

      // Validar que el número de cédula tenga entre 6 y 10 dígitos
      if (idNumber.length < 6 || idNumber.length > 10) {
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      const apiExpirationDate = convertToApiDateFormat(expirationDate);
      
      if (!/^\d{4}\/\d{2}$/.test(apiExpirationDate)) {
        throw new Error('Formato de fecha incorrecto. Use AAAA/MM (ej: 2027/10)');
      }

      // Construir el customerId uniendo tipo y número
      const customerId = buildCustomerId(idType, idNumber);

      // Preparar datos para el API
      const paymentData: PaymentRequest = {
        encryptedClient: clientData.encryptedClient,
        encryptedMerchant: clientData.encryptedMerchant,
        encryptedKey: clientData.encryptedKey,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cvv: cvv.replace(/\s/g, ''),
        expirationDate: apiExpirationDate,
        customerId: customerId,
        invoiceNumber: invoiceNumber,
        amount: clientData.amount,
        paymentMethod: 'tdc'
      };

      // Guardar datos de request para desarrollo
      setRawRequestData(paymentData);

      // Llamar al API
      const response: PaymentResponse = await PaymentApi.processPayment(paymentData);
      
      // Guardar respuesta para desarrollo
      setRawResponseData(response);
      
      // Pago exitoso
      setPaymentStatus('success');
      setResponseMessage(response.message);
      
      setTimeout(() => {
        onSuccess(response);
      }, 2000);
      
    } catch (error) {
      setPaymentStatus('error');
      
      // Guardar error para desarrollo
      setRawResponseData(error instanceof Error ? { error: error.message } : error);
      
      // EXTRAER EL MENSAJE ESPECÍFICO DEL ERROR
      let errorMessage = 'Error procesando el pago';
      
      if (error instanceof Error) {
        // Usar directamente el mensaje del error (que ahora viene formateado del API)
        errorMessage = error.message;
        
        // Solo para errores de validación del frontend, mantener mensajes específicos
        if (error.message.includes('complete todos los campos')) {
          errorMessage = 'Por favor complete todos los campos requeridos';
        } else if (error.message.includes('Formato de fecha incorrecto')) {
          errorMessage = 'Formato de fecha incorrecto. Use AAAA/MM (ej: 2027/10)';
        } else if (error.message.includes('cédula debe tener')) {
          errorMessage = error.message; // Mantener el mensaje específico de cédula
        } else if (error.message.includes('Número de factura no disponible')) {
          errorMessage = 'Número de factura no disponible';
        }
        // Para todos los demás errores, usar el mensaje que viene del API
      }
      
      setResponseMessage(errorMessage);
      console.error('❌ Error técnico completo:', error);
    }
  };

  const resetForm = () => {
    setPaymentStatus('idle');
    setResponseMessage('');
    setCardNumber('');
    setCvv('');
    setExpirationDate('');
    setIdType('V');
    setIdNumber('');
    setInvoiceNumber(clientData.invoiceNumber || clientData.orderId || '');
    setRawRequestData(null);
    setRawResponseData(null);
  };

  // Función para rellenar con datos específicos (actualizada)
  const fillWithData = (testData: any) => {
    setCardNumber(testData.cardNumber || '');
    setCvv(testData.cvv || '');
    setExpirationDate(testData.expirationDate?.replace(/\D/g, '') || '');
    
    // Parsear customerId si viene en testData
    if (testData.customerId) {
      const match = testData.customerId.match(/^([VEJ])(\d+)$/);
      if (match) {
        setIdType(match[1] as IdType);
        setIdNumber(match[2]);
      }
    } else {
      setIdType(testData.idType || 'V');
      setIdNumber(testData.idNumber || '');
    }
    
    setInvoiceNumber(testData.invoiceNumber || clientData.invoiceNumber || clientData.orderId || '');
  };

  // Estado de éxito
  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h3>
          <p className="text-gray-600 mb-4">{responseMessage}</p>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-green-800">
              Referencia: {invoiceNumber}
            </p>
            <p className="text-sm text-green-800">
              Cédula: {buildCustomerId(idType, idNumber)}
            </p>
            <p className="text-sm text-green-800">
              Monto: ${clientData.amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Realizar otro pago
          </button>
        </div>

        {/* Panel de desarrollador en estado de éxito */}
        {showDevPanel && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold mb-2">📊 Respuesta del API:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(rawResponseData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    
    <div className={`mx-auto p-6 bg-white rounded-lg shadow-lg ${
      embedded ? 'w-full max-w-full' : 'max-w-md' }`}>
         
      {/* Header condicional para modo Odoo */}
      {mode === 'odoo' && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-blue-800 font-medium">Pago seguro a través de Odoo</span>
          </div>
        </div>
      )}
     
      <h2 className="text-2xl font-bold mb-6 text-black">
        {mode === 'odoo' ? 'Pago con Tarjeta de Crédito' : 'Pago con Tarjeta de Crédito'}
      </h2>
      
      {/* Botón para mostrar/ocultar panel de desarrollador */}
      <div className="mb-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-black"
        >
          {showDevPanel ? '👨‍💻 Ocultar Dev' : '👨‍💻 Mostrar Dev'}
        </button>
      </div>

      {/* Información de la transacción */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="mb-3">
          <label className="block text-sm font-medium text-blue-800 mb-1">
            N° de Factura <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Ingrese el número de factura"
            className="w-full px-3 py-2 text-gray-900 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            disabled={paymentStatus === 'loading'}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-800">Monto a pagar:</span>
          <span className="text-lg font-bold text-green-600">
            ${clientData.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Panel de desarrollador */}
      {showDevPanel && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">🧪 Panel de Desarrollo</h4>
          
          {/* Datos de prueba rápidos */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-yellow-700 mb-1">Datos de prueba:</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillWithData({
                  cardNumber: '4110960300817842',
                  cvv: '330',
                  expirationDate: '202710',
                  idType: 'V',
                  idNumber: '8019884',
                  invoiceNumber: 'TEST-' + Date.now().toString().slice(-6)
                })}
                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
              >
                Tarjeta Válida
              </button>
              <button
                type="button"
                onClick={() => fillWithData({
                  cardNumber: '4110960300819999',
                  cvv: '999',
                  expirationDate: '202510',
                  idType: 'E',
                  idNumber: '123456789',
                  invoiceNumber: 'INVALID-001'
                })}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
              >
                Tarjeta Inválida
              </button>
              <button
                type="button"
                onClick={() => fillWithData({
                  cardNumber: '',
                  cvv: '',
                  expirationDate: '',
                  idType: 'V',
                  idNumber: '',
                  invoiceNumber: clientData.invoiceNumber || clientData.orderId || ''
                })}
                className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Datos actuales del formulario */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-yellow-700 mb-1">Datos actuales:</label>
            <div className="text-xs space-y-1 text-gray-900">
              <div>Factura: {invoiceNumber || '---'}</div>
              <div>Tarjeta: {cardNumber || '---'}</div>
              <div>CVV: {cvv || '---'} | Expira: {expirationDate || '---'}</div>
              <div>Cédula: {idType}-{idNumber || '---'}</div>
              <div>Customer ID (API): {buildCustomerId(idType, idNumber) || '---'}</div>
            </div>
          </div>

          {/* Request/Response anteriores */}
          {rawRequestData && (
            <div className="mt-2">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-yellow-700">
                  Último Request ↆ
                </summary>
                <pre className="text-xs bg-black text-green-400 p-2 rounded mt-1 overflow-auto max-h-32">
                  {JSON.stringify(rawRequestData, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {rawResponseData && (
            <div className="mt-2">
                <details>
                <summary className="cursor-pointer text-sm font-medium text-yellow-700">
                    {paymentStatus === 'error' ? '❌ Último Error' : '📥 Última Response'} ↆ
                </summary>
                <pre className={`text-xs bg-black p-2 rounded mt-1 overflow-auto max-h-32 ${
                    paymentStatus === 'error' ? 'text-red-400' : 'text-blue-400'
                }`}>
                    {JSON.stringify(rawResponseData, null, 2)}
                </pre>
                </details>
            </div>
            )}
        </div>
      )}

      {/* Mensaje de error */}
      {paymentStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-red-800 font-medium">Error en el pago</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{responseMessage}</p>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="text-red-600 hover:text-red-800 text-sm underline mt-2"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <form onSubmit={handlePayment}>
        {/* Campos del formulario */}
        <div className="mb-4">
          <label className="block text-gray-900 text-sm font-medium mb-2">Número de Tarjeta</label>
          <input
            type="text"
            value={formatCardNumber(cardNumber)}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="4110 9603 0081 7842"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
            required
            maxLength={19}
            disabled={paymentStatus === 'loading'}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-900 font-medium mb-2">CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="330"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
              required
              maxLength={4}
              disabled={paymentStatus === 'loading'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Fecha Expiración</label>
            <input
              type="text"
              value={formatExpirationDate(expirationDate)}
              onChange={(e) => setExpirationDate(e.target.value.replace(/\D/g, ''))}
              placeholder="AAAA/MM"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
              required
              maxLength={7}
              disabled={paymentStatus === 'loading'}
            />
            <p className="text-xs text-gray-500 mt-1">Ej: 2027/10</p>
          </div>
        </div>
        
        {/* Campo de Cédula dividido en tipo y número */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-900">Cédula <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value as IdType)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              disabled={paymentStatus === 'loading'}
            >
              <option value="V">V</option>
              <option value="E">E</option>
              <option value="J">J</option>
            </select>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="12345678"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
              required
              maxLength={10}
              disabled={paymentStatus === 'loading'}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
        </div>

        <button 
          type="submit" 
          disabled={paymentStatus === 'loading'}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
        >
          {paymentStatus === 'loading' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando Pago...
            </div>
          ) : (
            'Realizar Pago'
          )}
        </button>
      </form>
    </div>
  );
}