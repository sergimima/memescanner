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
