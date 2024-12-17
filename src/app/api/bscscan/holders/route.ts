import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Obtener el address de los parámetros de la URL
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Se requiere una dirección de contrato' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.bscscan.com/api?module=token&action=tokenholderlist&contractaddress=${address}&apikey=${process.env.NEXT_PUBLIC_BSCSCAN_API_KEY}&page=1&offset=100`
    );

    const data = await response.json();
    
    // Verificar si la respuesta es exitosa y contiene datos
    if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
      return NextResponse.json(data);
    } else {
      console.error('Error o sin datos de BSCScan:', data);
      return NextResponse.json(
        { error: 'No se encontraron holders', status: '0', result: [] },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error en el proxy de BSCScan:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de BSCScan' },
      { status: 500 }
    );
  }
}
