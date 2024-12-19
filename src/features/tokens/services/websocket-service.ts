import { ADDRESSES } from '../constants/addresses';

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private currentChain: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentSubscriptionId: string | null = null;
  private isReconnecting = false;
  private lastConnectTime = 0;
  private readonly minReconnectInterval = 5000; // Mínimo 5 segundos entre reconexiones
  private processedEvents: Set<string> = new Set();

  // Lista de tokens establecidos que queremos excluir
  private readonly ESTABLISHED_TOKENS = new Set([
    '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', // CAKE
    '0x7083609fce4d1d8dc0c979aab8c869ea2c873402', // DOT
    '0x7950865a9140cb519342433146ed5b40c6f210f7', // BAND
    '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47', // ADA
    '0xba2ae424d960c26247dd6c32edc70b295c744c43', // DOGE
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8', // ETH
    '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', // XRP
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
    '0x55d398326f99059ff775485246999027b3197955', // USDT
    '0xe9e7cea3dedca5984780bafc599bd69add087d56', // BUSD
    '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', // DAI
  ].map(address => address.toLowerCase()));

  private isEstablishedToken(address: string): boolean {
    return this.ESTABLISHED_TOKENS.has(address.toLowerCase()) ||
           address.toLowerCase() === ADDRESSES.WBNB.toLowerCase();
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connectToChain(chain: string, force = false) {
    const now = Date.now();

    // Si ya estamos conectados al mismo chain y no es forzado, no hacer nada
    if (!force && this.currentChain === chain && this.connectionStatus === 'connected') {
      console.log(`[${this.formatTime(new Date())}][WebSocket] Ya conectado a ${chain}`);
      return;
    }

    // Verificar si hay una reconexión en progreso
    if (!force && this.isReconnecting) {
      console.log(`[${this.formatTime(new Date())}][WebSocket] Ya hay una reconexión en progreso`);
      return;
    }

    // Verificar el intervalo mínimo entre reconexiones
    if (!force && now - this.lastConnectTime < this.minReconnectInterval) {
      console.log(`[${this.formatTime(new Date())}][WebSocket] Esperando el intervalo mínimo entre reconexiones`);
      setTimeout(() => this.connectToChain(chain, true), this.minReconnectInterval);
      return;
    }

    // Actualizar estado antes de iniciar la conexión
    this.isReconnecting = true;
    this.connectionStatus = 'connecting';
    this.lastConnectTime = now;

    // Cerrar conexión existente si la hay
    if (this.ws) {
      try {
        this.ws.close(1000, 'Cierre controlado');
      } catch (error) {
        console.error(`[${this.formatTime(new Date())}][WebSocket] Error al cerrar conexión:`, error);
      }
      this.ws = null;
    }

    const endpoint = this.getWebSocketUrl(chain);
    console.log(`[${this.formatTime(new Date())}][WebSocket] Conectando a ${endpoint}...`);
    this.currentChain = chain;

    try {
      this.ws = new WebSocket(endpoint);
      this.setupHandlers();
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}][WebSocket] Error al crear conexión:`, error);
      this.connectionStatus = 'disconnected';
      this.isReconnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`[${this.formatTime(new Date())}][WebSocket] Máximo número de intentos alcanzado`);
      this.isReconnecting = false;
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[${this.formatTime(new Date())}][WebSocket] Programando reconexión en ${delay}ms (intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.currentChain) {
        this.reconnectAttempts++;
        this.connectToChain(this.currentChain, true);
      }
    }, delay);
  }

  private setupHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.connectionStatus = 'connected';
      console.log(`[${this.formatTime(new Date())}][WebSocket] Conectado a ${this.currentChain}`);
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.startHeartbeat();
      
      // Esperar un momento antes de suscribirse
      setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.setupSubscriptions(this.currentChain!);
        }
      }, 1000);

      const event = new CustomEvent('wsConnectionUpdate', { 
        detail: { status: this.connectionStatus, chain: this.currentChain } 
      });
      window.dispatchEvent(event);
    };

    this.ws.onclose = (event) => {
      const codes = {
        1000: 'Cierre normal',
        1001: 'Going Away',
        1002: 'Error de protocolo',
        1003: 'Tipo de datos no aceptado',
        1004: 'Reservado',
        1005: 'Sin código de estado',
        1006: 'Cierre anormal',
        1007: 'Datos inválidos',
        1008: 'Violación de política',
        1009: 'Mensaje demasiado grande',
        1010: 'Extensión requerida',
        1011: 'Error inesperado',
        1012: 'Reinicio de servicio',
        1013: 'Try Again Later',
        1014: 'Bad Gateway',
        1015: 'TLS Handshake'
      };
      
      const reason = codes[event.code as keyof typeof codes] || 'Desconocido';
      console.log(`[${this.formatTime(new Date())}][WebSocket] Desconectado de ${this.currentChain}. Código: ${event.code} (${reason})`);
      
      this.connectionStatus = 'disconnected';
      this.stopHeartbeat();
      this.currentSubscriptionId = null;
      
      // Solo intentar reconectar si no fue un cierre controlado
      if (event.code !== 1000 && !this.isReconnecting) {
        this.scheduleReconnect();
      }

      const wsEvent = new CustomEvent('wsConnectionUpdate', { 
        detail: { 
          status: this.connectionStatus, 
          chain: this.currentChain,
          code: event.code,
          reason: reason
        } 
      });
      window.dispatchEvent(wsEvent);
    };

    this.ws.onerror = (error: Event) => {
      const wsError = error as ErrorEvent;
      console.error(`[${this.formatTime(new Date())}][WebSocket] Error:`, {
        message: wsError.message,
        type: wsError.type,
        error: wsError.error
      });
      
      // No cambiar el estado aquí, dejar que onclose maneje eso
      const errorEvent = new CustomEvent('wsError', { 
        detail: { 
          error: wsError,
          chain: this.currentChain 
        } 
      });
      window.dispatchEvent(errorEvent);
    };

    this.ws.onmessage = this.handleMessage.bind(this);
  }

  private setupSubscriptions(chain: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error(`[${this.formatTime(new Date())}][WebSocket] No se puede suscribir: conexión no abierta`);
      return;
    }

    console.log(`[${this.formatTime(new Date())}][WebSocket] Configurando suscripción para eventos de PancakeSwap Factory`);

    // Topic para el evento PairCreated(address,address,address,uint256)
    const PAIR_CREATED_TOPIC = '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';
    
    // Verificar la dirección del factory
    const factoryAddress = ADDRESSES.PANCAKE_FACTORY.toLowerCase();
    console.log(`[${this.formatTime(new Date())}][WebSocket] Dirección del factory:`, {
      original: ADDRESSES.PANCAKE_FACTORY,
      lowercase: factoryAddress,
      isValid: /^0x[a-f0-9]{40}$/.test(factoryAddress)
    });
    
    const subscribeMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_subscribe',
      params: [
        'logs',
        {
          address: factoryAddress,
          topics: [PAIR_CREATED_TOPIC]
        }
      ]
    };

    console.log(`[${this.formatTime(new Date())}][WebSocket] Configuración de suscripción completa:`, JSON.stringify(subscribeMessage, null, 2));

    try {
      console.log(`[${this.formatTime(new Date())}][WebSocket] Enviando mensaje de suscripción...`);
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log(`[${this.formatTime(new Date())}][WebSocket] Mensaje de suscripción enviado`);
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}][WebSocket] Error al enviar suscripción:`, error);
      this.ws.close();
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      const now = new Date();

      // Para debug: ver todos los mensajes recibidos
      if (!data.method || data.method !== 'eth_subscription') {
        console.log(`[${this.formatTime(now)}][WebSocket] Mensaje recibido:`, JSON.stringify(data, null, 2));
      }

      // Guardar ID de suscripción
      if (data.id === 1 && data.result) {
        this.currentSubscriptionId = data.result;
        console.log(`[${this.formatTime(now)}][WebSocket] Suscripción exitosa, ID:`, this.currentSubscriptionId);
        return;
      }

      // Procesar eventos de nuevos pares
      if (data.method === 'eth_subscription' && data.params?.subscription === this.currentSubscriptionId) {
        const result = data.params.result;
        
        // Verificar que es un evento de PairCreated
        const PAIR_CREATED_TOPIC = '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';
        if (result.topics[0] !== PAIR_CREATED_TOPIC) {
          return;
        }

        // Decodificar las direcciones de los tokens
        const token0 = '0x' + result.topics[1].slice(26).toLowerCase();
        const token1 = '0x' + result.topics[2].slice(26).toLowerCase();
        const pairAddress = '0x' + result.data.slice(26, 66).toLowerCase();

        // Verificar si alguno de los tokens es un token establecido
        if (this.isEstablishedToken(token0) && this.isEstablishedToken(token1)) {
          console.log(`[${this.formatTime(now)}][WebSocket] Par ignorado: ambos tokens son establecidos`, {
            token0,
            token1
          });
          return;
        }

        // Determinar cuál token es el nuevo (no establecido)
        const newToken = this.isEstablishedToken(token0) ? token1 : token0;

        console.log(`[${this.formatTime(now)}][WebSocket] Nuevo par detectado:`, {
          token0,
          token1,
          newToken,
          pairAddress,
          blockNumber: result.blockNumber,
          transactionHash: result.transactionHash
        });

        const newPairEvent = new CustomEvent('newPairEvent', {
          detail: { 
            data: {
              ...result,
              token0,
              token1,
              newToken,
              pairAddress
            }
          }
        });
        window.dispatchEvent(newPairEvent);
      }
    } catch (error) {
      console.error(`[${this.formatTime(new Date())}][WebSocket] Error al procesar mensaje:`, error);
    }
  }

  private getWebSocketUrl(chain: string): string {
    switch (chain) {
      case 'bsc':
        return process.env.NEXT_PUBLIC_BSC_WSS_URL || '';
      default:
        throw new Error(`Chain ${chain} not supported`);
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ jsonrpc: '2.0', id: 9999, method: 'net_version', params: [] }));
        } catch (error) {
          console.error(`[${this.formatTime(new Date())}][WebSocket] Error en heartbeat:`, error);
        }
      }
    }, 30000); // Cada 30 segundos
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  }

  // Método para obtener el estado actual
  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      chain: this.currentChain,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
