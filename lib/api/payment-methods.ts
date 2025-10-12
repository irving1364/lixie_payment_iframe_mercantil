import { 
  TdcPaymentRequest, 
  TdcPaymentResponse,
  PagoMovilAuthRequest,
  PagoMovilAuthResponse,
  PagoMovilPaymentRequest,
  PagoMovilPaymentResponse
} from '@/lib/types/payment-methods';

const API_BASE_URL = 'https://connect-api-y3jc.onrender.com';

// Clase base para manejar errores de API
class PaymentApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public responseData?: any
  ) {
    super(message);
    this.name = 'PaymentApiError';
  }
}

// API para TDC
export class TdcPaymentApi {
  static async processPayment(paymentData: TdcPaymentRequest): Promise<TdcPaymentResponse> {
    console.log('💳 Enviando pago TDC a /pay:', {
      ...paymentData,
      cardNumber: `${paymentData.cardNumber.substring(0, 6)}...${paymentData.cardNumber.substring(12)}`
    });
    
    const response = await fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'frontend_lang=es_VE'
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 Response TDC raw:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      throw new PaymentApiError(responseText || `Error ${response.status} en el servidor`, response.status);
    }
    
    if (responseData.status === 'error') {
      throw new PaymentApiError(responseData.message || 'Error en el procesamiento del pago', response.status, responseData);
    }
    
    if (!response.ok) {
      throw new PaymentApiError(responseData.message || `Error ${response.status} en el servidor`, response.status, responseData);
    }
    
    return responseData as TdcPaymentResponse;
  }
}

// API para Pago Móvil
export class PagoMovilApi {
  // Paso 1: Solicitar autenticación (OTP)
   static async requestAuth(authData: PagoMovilAuthRequest): Promise<PagoMovilAuthResponse> {
    console.log('📱 Solicitando autenticación Pago Móvil a /auth:', {
        ...authData,
        cardNumber: `${authData.cardNumber.substring(0, 6)}...${authData.cardNumber.substring(12)}`
    });
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': 'frontend_lang=es_VE',
            'Accept': 'application/json',
            'User-Agent': 'NextJS-PaymentGateway/1.0'
        },
        credentials: 'include', // ← IMPORTANTE: para incluir cookies
        body: JSON.stringify(authData),
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📥 Response raw:', responseText);
        
        let responseData;
        try {
        responseData = JSON.parse(responseText);
        } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new PaymentApiError(responseText || `Error ${response.status} en el servidor`, response.status);
        }
        
        console.log('📥 Response parsed:', responseData);
        
        if (responseData.status === 'error') {
        throw new PaymentApiError(responseData.message || 'Error en la autenticación', response.status, responseData);
        }
        
        if (!response.ok) {
        throw new PaymentApiError(responseData.message || `Error ${response.status} en el servidor`, response.status, responseData);
        }
        
        return responseData as PagoMovilAuthResponse;
    } catch (error) {
        console.error('❌ Error en requestAuth:', error);
        throw error;
    }
    }

  // Paso 2: Confirmar pago con OTP
  static async confirmPayment(paymentData: PagoMovilPaymentRequest): Promise<PagoMovilPaymentResponse> {
    console.log('📱 Confirmando pago móvil a /api/pay-mobile/c2p:', paymentData);
    
    const response = await fetch(`${API_BASE_URL}/api/pay-mobile/c2p`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'frontend_lang=es_VE'
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 Response Pago Móvil raw:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      throw new PaymentApiError(responseText || `Error ${response.status} en el servidor`, response.status);
    }
    
    // Para pago móvil, manejamos el status code de manera diferente
    if (response.status !== 200) {
      throw new PaymentApiError(
        responseData.message || `Error ${response.status} en el pago móvil`, 
        response.status, 
        responseData
      );
    }
    
    return responseData as PagoMovilPaymentResponse;
  }
}


