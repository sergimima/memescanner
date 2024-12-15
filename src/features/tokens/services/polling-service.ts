import { ADDRESSES } from '../constants/addresses';

export class PollingService {
  private static instance: PollingService;
  private currentChain: string | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private lastBlockNumber: number = 0;

  static getInstance() {
    if (!PollingService.instance) {
      PollingService.instance = new PollingService();
    }
    return PollingService.instance;
  }

  startPolling(chain: string) {
    // Limpiar intervalo anterior si existe
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.currentChain = chain;
    this.lastBlockNumber = 0;

    // Iniciar nuevo polling
    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, 3000); // Polling cada 3 segundos
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentChain = null;
  }

  private async checkForUpdates() {
    if (!this.currentChain) return;

    try {
      const response = await fetch(`https://api.bscscan.com/api`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          module: 'logs',
          action: 'getLogs',
          fromBlock: this.lastBlockNumber,
          address: ADDRESSES.PANCAKE_FACTORY,
          topic0: '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9', // PairCreated event
          apikey: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY
        })
      });

      const data = await response.json();
      
      if (data.status === '1' && data.result.length > 0) {
        // Actualizar último bloque procesado
        this.lastBlockNumber = parseInt(data.result[data.result.length - 1].blockNumber, 16);

        // Emitir evento con las actualizaciones
        const event = new CustomEvent('tokenUpdate', {
          detail: {
            data: data.result,
            chain: this.currentChain
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('[Polling] Error:', error);
    }
  }

  getStatus() {
    return {
      isPolling: !!this.intervalId,
      chain: this.currentChain,
      lastBlock: this.lastBlockNumber
    };
  }
}
