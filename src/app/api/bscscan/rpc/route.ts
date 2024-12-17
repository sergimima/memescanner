import { NextResponse } from 'next/server';
import { BSC_RPC_URLS } from '@/config/rpc';

// Tipos para las respuestas RPC
interface RPCError {
  message: string;
  code?: number;
}

interface RPCResponse {
  error?: RPCError;
  result?: any;
}

// Mantener un índice para rotar entre URLs
let currentUrlIndex = 0;

// Función para obtener la siguiente URL en rotación
function getNextRPC(): string {
  const url = BSC_RPC_URLS[currentUrlIndex];
  currentUrlIndex = (currentUrlIndex + 1) % BSC_RPC_URLS.length;
  return url;
}

// Función para retrasar la ejecución
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const body = await request.json();
      const rpcUrl = getNextRPC();
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RPCResponse = await response.json();
      
      // Si la respuesta indica un error de rate limit, intentar con otro RPC
      if (data.error && (
        data.error.message.includes('rate limit') || 
        data.error.message.includes('too many requests')
      )) {
        throw new Error('Rate limit exceeded');
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error(`Intento ${attempt + 1} fallido:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Si no es el último intento, esperar antes de reintentar
      if (attempt < maxRetries - 1) {
        await delay(Math.pow(2, attempt) * 1000); // Espera exponencial
      }
    }
  }

  return NextResponse.json(
    { 
      error: {
        message: `Error después de ${maxRetries} intentos: ${lastError?.message || 'Unknown error'}`,
        code: -32005 // Código común para rate limit
      }
    },
    { status: 429 }
  );
}
