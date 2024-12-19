import { formatUnits } from 'viem'

export function formatNumber(value: bigint | string | number, decimals: number = 18): string {
  try {
    // Convertir el valor a string si es bigint o número
    const valueString = typeof value === 'bigint' ? value.toString() : value.toString()
    
    // Usar formatUnits de viem para manejar los decimales
    const formatted = formatUnits(BigInt(valueString), decimals)
    
    // Formatear con separadores de miles y máximo 2 decimales si es un número grande
    const num = parseFloat(formatted)
    if (num > 1000) {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    }
    
    // Para números pequeños, mostrar más decimales
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    })
  } catch (error) {
    console.error('Error formateando número:', error)
    return '0'
  }
}

export function formatUSD(value: number): string {
  if (value < 0.000001) {
    // Para números muy pequeños, usar notación científica
    return `$${value.toExponential(6)}`
  } else if (value < 1) {
    // Para números pequeños pero no tanto, mostrar todos los decimales necesarios
    return `$${value.toFixed(10)}`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export function formatPrice(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (num < 0.000001) {
    return num.toExponential(6);
  } else if (num < 1) {
    return num.toFixed(8);
  }
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}
