'use client'

import React, { useEffect, useState } from 'react'
import { WebSocketService } from '@/features/tokens/services/websocket-service'

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected'
  chain: string | null
  reconnectAttempts: number
}

export function WebSocketStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    chain: null,
    reconnectAttempts: 0
  })

  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent<ConnectionStatus>) => {
      setStatus(event.detail)
    }

    // Obtener estado inicial
    const wsService = WebSocketService.getInstance()
    setStatus(wsService.getConnectionStatus())

    // Suscribirse a actualizaciones
    window.addEventListener('wsConnectionUpdate', handleStatusUpdate as EventListener)

    return () => {
      window.removeEventListener('wsConnectionUpdate', handleStatusUpdate as EventListener)
    }
  }, [])

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-red-500'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="font-medium">
          WebSocket: {status.status}
          {status.chain && ` (${status.chain})`}
        </span>
      </div>
      {status.reconnectAttempts > 0 && (
        <div className="mt-1 text-sm text-gray-500">
          Reconexión: {status.reconnectAttempts}/5
        </div>
      )}
    </div>
  )
}
