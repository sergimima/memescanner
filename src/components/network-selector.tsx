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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedNetwork ? (
            <div className="flex items-center gap-2">
              {React.createElement(networkIcons[selectedNetwork.id], {
                className: "h-4 w-4"
              })}
              <span>{selectedNetwork.name}</span>
            </div>
          ) : (
            "Seleccionar Red"
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-white dark:bg-gray-950 border shadow-lg">
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
                  "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  value === network.id && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{network.name}</span>
                </div>
                {value === network.id && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
