'use client'

import React, { useEffect, useState } from 'react'
import { NetworkId } from '@/config/networks'

interface TokenUpdate {
  data: any
  chain: NetworkId
  timestamp: number
}

export function TokenUpdates() {
  const [updates, setUpdates] = useState<TokenUpdate[]>([])

  useEffect(() => {
    const handleUpdate = (event: CustomEvent<{ data: any; chain: NetworkId }>) => {
      setUpdates(prev => [
        {
          data: event.detail.data,
          chain: event.detail.chain,
          timestamp: Date.now()
        },
        ...prev
      ].slice(0, 50)) // Mantener solo las últimas 50 actualizaciones
    }

    // Añadir listener
    window.addEventListener('tokenUpdate', handleUpdate as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('tokenUpdate', handleUpdate as EventListener)
    }
  }, [])

  if (updates.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Actualizaciones en Tiempo Real</h3>
      <div className="space-y-2">
        {updates.map((update, index) => (
          <div
            key={index}
            className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {update.chain.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(update.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <pre className="mt-2 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {JSON.stringify(update.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
