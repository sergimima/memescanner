'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { networks, NetworkId } from '@/config/networks'
import { 
  EthereumIcon, 
  SolanaIcon, 
  BSCIcon, 
  BaseIcon, 
  ArbitrumIcon 
} from '@/components/icons/blockchain'
import { WebSocketService } from '@/features/tokens/services/websocket-service'

const networkIcons: Record<NetworkId, React.ComponentType<any>> = {
  ethereum: EthereumIcon,
  solana: SolanaIcon,
  bsc: BSCIcon,
  base: BaseIcon,
  arbitrum: ArbitrumIcon,
}

interface NetworkSelectorProps {
  value: NetworkId
  onValueChange: (value: NetworkId) => void
}

export function NetworkSelector({ value, onValueChange }: NetworkSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const selectedNetwork = networks.find((network) => network.id === value)
  const wsService = React.useMemo(() => WebSocketService.getInstance(), [])

  // Conectar WebSocket cuando cambia la red
  React.useEffect(() => {
    if (value && ['bsc', 'ethereum', 'base', 'arbitrum'].includes(value)) {
      wsService.connectToChain(value);
    }
  }, [value, wsService]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/90 transition-all duration-200"
        >
          {selectedNetwork ? (
            <div className="flex items-center gap-2">
              {React.createElement(networkIcons[selectedNetwork.id], {
                className: "h-4 w-4"
              })}
              <span className="text-gray-700 dark:text-gray-200">{selectedNetwork.name}</span>
            </div>
          ) : (
            "Seleccionar Red"
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg">
        <div className="space-y-1">
          {networks.map((network) => {
            const Icon = networkIcons[network.id]
            return (
              <button
                key={network.id}
                onClick={() => {
                  onValueChange(network.id as NetworkId)
                  setOpen(false)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200",
                  "text-gray-700 dark:text-gray-200",
                  "hover:bg-gray-50 dark:hover:bg-gray-800",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50",
                  value === network.id && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{network.name}</span>
                </div>
                {value === network.id && (
                  <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
