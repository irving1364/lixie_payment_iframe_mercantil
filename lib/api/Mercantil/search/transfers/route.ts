import { NextRequest, NextResponse } from 'next/server';
import { TransferSearchRequest, TransferSearchResponse } from '@/lib/types/search-types';

// En /app/api/search/transfers/route.ts
export async function POST(request: NextRequest) {
  try {
    const searchData: TransferSearchRequest = await request.json();

    // Llamada a tu endpoint real
    const bankResponse = await fetch('https://tu-endpoint-real.com/api/search/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchData),
    });

    if (!bankResponse.ok) {
      throw new Error(`Error HTTP del banco: ${bankResponse.status}`);
    }

    const bankData = await bankResponse.json();
    console.log('🏦 [BANK_API] Respuesta recibida:', bankData);

    // ✅ MAPEAR CORRECTAMENTE la respuesta real
    const apiResponse: TransferSearchResponse = {
      success: bankData.status === 'success',  // ← ESTA ES LA CLAVE
      message: bankData.message,
      data: {
        transactionFound: bankData.status === 'success',
        transactionDetails: bankData.bank_response?.transferSearchList?.[0],
        bankResponse: bankData.bank_response
      }
    };

    console.log('🔍 [API_TRANSFER_SEARCH] Respuesta mapeada:', apiResponse);
    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error('❌ [API_TRANSFER_SEARCH] Error:', error);
    
    const errorResponse: TransferSearchResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}