# 🚀 MemeScanner - Early Memecoin Detection Platform

## 📝 Descripción
MemeScanner es una plataforma web moderna diseñada para detectar y analizar nuevas memecoins antes de que se vuelvan virales. La plataforma monitorea múltiples blockchains y proporciona análisis en tiempo real de tokens recién creados.

## 🎯 Características Principales
- **Multi-Chain Support**: 
  - Solana (Principal foco)
  - Ethereum
  - BSC
  - Base
  - Arbitrum

## 🔍 Criterios de Detección de Memecoins

### Indicadores Primarios
- **Liquidez y Trading**:
  - Liquidez inicial > $5,000
  - Ratio de compra/venta balanceado (>40% en ambas direcciones)
  - Volumen de trading creciente en las primeras 24h
  - Verificación de Liquidez Bloqueada:
    - Tiempo mínimo de bloqueo: 30 días
    - Porcentaje mínimo bloqueado: 80% del pool
    - Contrato de bloqueo verificado en:
      - Ethereum: Unicrypt, Team.Finance, PinkSale
      - BSC: Mudra, DxSale
      - Solana: Verificación en Raydium/Orca
    - Sin tokens de LP en wallets del equipo
    - Monitoreo de eventos de adición/remoción de liquidez

- **Distribución de Tokens**:
  - Max wallet < 2% del supply total
  - Team wallet < 5% del supply total
  - Top 10 holders < 30% del supply total
  - Número mínimo de holders > 50 en 24h

- **Smart Contract**:
  - Sin funciones de honeypot
  - Sin capacidad de mint ilimitado
  - Sin funciones de pausa de trading
  - Renunciado ownership o multisig
  - Tax máximo combinado < 10%

### Indicadores Secundarios
- **Métricas Sociales**:
  - Crecimiento orgánico de seguidores
  - Engagement en redes sociales
  - Menciones en canales crypto
  - Sentiment analysis positivo

- **Patrones de Trading**:
  - Sin wash trading sospechoso
  - Distribución natural de trades
  - Sin pump & dump patterns
  - Precio estable o en crecimiento sostenido

### Sistema de Puntuación
- **Seguridad** (40 puntos):
  - Contract audit: 15 puntos
  - Liquidez bloqueada (máx 15 puntos):
    - >6 meses: 15 puntos
    - >3 meses: 10 puntos
    - >1 mes: 5 puntos
    - Verificación del contrato de bloqueo: +2 puntos
    - >90% liquidez bloqueada: +3 puntos
  - Ownership renunciado: 10 puntos
  - KYC verificado: 5 puntos

- **Liquidez** (30 puntos):
  - >$50k: 15 puntos
  - >$20k: 10 puntos
  - >$5k: 5 puntos

- **Comunidad** (30 puntos):
  - >500 holders: 10 puntos
  - >1000 social followers: 10 puntos
  - Engagement orgánico: 10 puntos

## 🎨 Estilos y CSS

#### Stack Principal
- **TailwindCSS**: Utilidades CSS
- **shadcn/ui**: Componentes base
- **CSS Modules**: Estilos específicos por componente
- **CSS Variables**: Tematización

#### Configuración Tailwind
```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### Variables CSS Globales
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .custom-scroll {
    @apply scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700;
  }
}
```

#### Componentes shadcn/ui
```typescript
// Ejemplo de Button personalizado
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
```

#### Utilidades CSS Personalizadas
```typescript
// utils/styles.ts
export const styles = {
  gradients: {
    primary: 'bg-gradient-to-r from-primary to-secondary',
    accent: 'bg-gradient-to-r from-accent to-primary',
  },
  animations: {
    fadeIn: 'animate-fadeIn',
    slideIn: 'animate-slideIn',
  },
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-12 sm:py-16 lg:py-20',
  },
}
```

#### Responsive Design Utilities
```css
/* Breakpoints personalizados */
@custom-media --mobile (max-width: 640px);
@custom-media --tablet (min-width: 641px) and (max-width: 1024px);
@custom-media --desktop (min-width: 1025px);

/* Ejemplo de uso */
@media (--mobile) {
  .container {
    padding: 1rem;
  }
}
```

## 🎨 Interfaz de Usuario

### Componentes Principales
- **Header**
  - Selector de red (Ethereum, BSC, etc.)
  - Selector tema claro/oscuro
  - Conectar wallet
  - Menú de navegación

- **Dashboard Principal**
  ```
  ┌─────────────────────────────────────────────┐
  │ 📊 Resumen General                          │
  ├─────────────┬─────────────┬────────────────┤
  │ Nuevos      │ Volumen     │ Tendencias     │
  │ Tokens 24h  │ Total       │ Sociales       │
  └─────────────┴─────────────┴────────────────┘
  ```

- **Lista de Tokens**
  ```
  ┌─────────────────────────────────────────────┐
  │ 🔍 Filtros y Búsqueda                       │
  ├─────────────────────────────────────────────┤
  │ Token | Precio | Holders | Score | Acciones │
  ├─────────────────────────────────────────────┤
  │ [Tabla de tokens con paginación]            │
  └─────────────┴─────────────┴────────────────┘
  ```

- **Vista Detallada de Token**
  ```
  ┌─────────────────────────────────────────────┐
  │ Token Info | Holders | Social | Seguridad   │
  ├─────────────────────────────────────────────┤
  │ Gráficos y Métricas                         │
  ├─────────────────────────────────────────────┤
  │ Análisis Técnico                            │
  └─────────────┴─────────────┴────────────────┘
  ```

### 👛 Modo de Acceso

#### Sin Wallet (Modo Lectura)
- **Funcionalidades Disponibles**:
  - Ver lista de nuevos tokens
  - Consultar análisis de seguridad
  - Ver métricas y gráficos
  - Acceder a información histórica
  - Ver tendencias de mercado
  - Explorar rankings de tokens
  - Acceder a la documentación

#### Con Wallet (Modo Completo)
- **Funcionalidades Adicionales**:
  - Guardar tokens favoritos
  - Configurar alertas personalizadas
  - Interactuar con contratos
  - Realizar operaciones de trading
  - Personalizar dashboard
  - Guardar configuraciones

#### Estado de Conexión
```typescript
type ConnectionState = {
  isConnected: boolean;
  address: string | null;
  mode: 'read' | 'full';
};

const useWalletState = () => {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    address: null,
    mode: 'read'
  });

  // La app funciona por defecto en modo lectura
  useEffect(() => {
    setState(prev => ({
      ...prev,
      mode: prev.isConnected ? 'full' : 'read'
    }));
  }, [state.isConnected]);

  return {
    ...state,
    isReadOnly: state.mode === 'read',
    canInteract: state.mode === 'full'
  };
};
```

#### Interfaz Visual
```
// Sin Wallet
┌─────────────────────────────┐
│   🔍 Modo Lectura          │
│   Conectar Wallet para más  │
│   funcionalidades          │
└─────────────────────────────┘

// Con Wallet
┌─────────────────────────────┐
│   ✅ Modo Completo         │
│   0x1234...5678            │
└─────────────────────────────┘
```

#### Transición entre Modos
- El usuario puede navegar y usar funciones básicas sin wallet
- Al intentar usar funciones avanzadas:
  ```typescript
  const handleFeatureAccess = (feature: string) => {
    if (requiresWallet(feature) && !isConnected) {
      showConnectPrompt({
        message: "Conecta tu wallet para acceder a esta función",
        feature: feature,
        onConnect: () => activateFeature(feature)
      });
      return;
    }
    activateFeature(feature);
  };
  ```

### Características UI/UX
- **Diseño Responsivo**
  - Desktop: 3 columnas
  - Tablet: 2 columnas
  - Mobile: 1 columna
  - Breakpoints: 
    - Mobile: <768px
    - Tablet: 768px-1024px
    - Desktop: >1024px

- **Temas**
  - Claro/Oscuro automático
  - Personalización de colores
  - Modo alto contraste
  - Soporte para daltonismo

- **Interactividad**
  - Gráficos interactivos con zoom
  - Tooltips informativos
  - Notificaciones en tiempo real
  - Drag & drop para personalización

- **Componentes Avanzados**
  - Tablas ordenables y filtrables
  - Gráficos de velas (TradingView)
  - Heatmaps de actividad
  - Indicadores técnicos

### Performance UI
- **Optimizaciones**:
  - Lazy loading de imágenes
  - Virtualización de listas largas
  - Caching de datos en cliente
  - Prefetch de rutas comunes

- **Métricas Objetivo**:
  - Tiempo de carga inicial: <2s
  - First Contentful Paint: <1s
  - Time to Interactive: <3s
  - Performance Score: >90

### Accesibilidad
- WCAG 2.1 AA compliant
- Soporte para lectores de pantalla
- Navegación por teclado
- Etiquetas ARIA apropiadas

### Componentes shadcn/ui
```typescript
// Componentes principales utilizados
import {
  Card,
  DataTable,
  Dialog,
  DropdownMenu,
  Tabs,
  Toast,
  Tooltip,
} from "@/components/ui"
```

### Sistema de Diseño
- **Colores**:
  ```css
  --primary: #2563eb;
  --secondary: #4f46e5;
  --accent: #0ea5e9;
  --background: #ffffff;
  --foreground: #020617;
  ```

- **Tipografía**:
  ```css
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  ```

- **Espaciado**:
  ```css
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  ```

### Estados de Carga
- **Loading States**:
  - Skeletons para datos
  - Spinners para acciones
  - Progress bars para procesos
  - Placeholders para imágenes

- **Error States**:
  - Mensajes de error amigables
  - Opciones de retry
  - Fallbacks visuales
  - Modo offline

### Animaciones
- **Transiciones**:
  - Suaves entre rutas
  - Fade in/out de elementos
  - Slide para drawers
  - Scale para modales

- **Microinteracciones**:
  - Hover states
  - Focus rings
  - Click feedback
  - Success/Error feedback

## 📈 Roadmap
1. **Fase 1** (Q1 2024): 
   - Setup inicial y soporte Solana
   - Implementación de criterios básicos
   - UI/UX básica

2. **Fase 2** (Q2 2024): 
   - Integración multi-chain
   - Sistema de scoring
   - Análisis de contratos

3. **Fase 3** (Q3 2024): 
   - Sistema de alertas
   - Análisis social
   - API pública

4. **Fase 4** (Q4 2024): 
   - Machine Learning para detección
   - Predicciones automáticas
   - Dashboard avanzado

## 🔐 Seguridad y Limitaciones
- Rate limits en APIs: 5 calls/segundo
- Máximo de tokens monitoreados: 1000/chain
- Tiempo mínimo de análisis: 24h
- Refresh rate de datos: 5 minutos

## 🤝 Contribución
Las contribuciones son bienvenidas. Por favor, revisa las guías de contribución antes de empezar.

## 📄 Licencia
MIT License

## 📝 Estado del Desarrollo UI

### Componentes Principales
- [x] Header completo
  - [x] Selector de red (Ethereum, BSC, etc.)
  - [x] Selector tema claro/oscuro
  - [ ] Conectar wallet
  - [ ] Menú de navegación

### Diseño y Temas
- [x] Modo Claro/Oscuro
  - [x] Transiciones suaves
  - [x] Gradientes adaptativos
  - [x] Detección automática del tema
  - [x] Efectos de glassmorphism

### Tarjetas y Contenedores
- [x] TokenCard
  - [x] Diseño moderno con glassmorphism
  - [x] Efectos hover suaves
  - [x] Gradientes en scores
  - [x] Contraste optimizado

### Fondos y Gradientes
- [x] Fondo principal adaptativo
  - [x] Gradientes personalizados por tema
  - [x] Transiciones suaves
  - [x] Contraste mejorado

### Componentes Avanzados
- [ ] Tablas ordenables y filtrables
- [ ] Gráficos de velas (TradingView)
- [ ] Heatmaps de actividad
- [ ] Indicadores técnicos

### Estados de Carga
- [ ] Skeletons para datos
- [ ] Spinners para acciones
- [ ] Progress bars para procesos
- [ ] Placeholders para imágenes

### Animaciones y Transiciones
- [x] Transiciones de tema
- [ ] Fade in/out de elementos
- [ ] Slide para drawers
- [ ] Scale para modales
- [x] Microinteracciones (hover states)

### Accesibilidad
- [ ] WCAG 2.1 AA compliant
- [ ] Soporte para lectores de pantalla
- [ ] Navegación por teclado
- [ ] Etiquetas ARIA

## 📦 Dependencias y Versiones

### Core
```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.3.3"
  }
}
```

### UI y Estilos
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "1.0.5",
    "@radix-ui/react-dropdown-menu": "2.0.6",
    "@radix-ui/react-slot": "1.0.2",
    "@radix-ui/react-tabs": "1.0.4",
    "class-variance-authority": "0.7.0",
    "clsx": "2.0.0",
    "tailwind-merge": "2.2.0",
    "tailwindcss": "3.4.0",
    "tailwindcss-animate": "1.0.7",
    "@tailwindcss/typography": "0.5.10",
    "lucide-react": "0.303.0",
    "next-themes": "0.2.1"
  }
}
```

### Blockchain y Web3
```json
{
  "dependencies": {
    "viem": "1.21.1",
    "wagmi": "1.4.12",
    "@solana/web3.js": "1.87.6",
    "ethers": "6.9.1",
    "@web3modal/ethereum": "2.7.1",
    "@web3modal/react": "2.7.1"
  }
}
```

### Estado y Data Fetching
```json
{
  "dependencies": {
    "@tanstack/react-query": "5.14.2",
    "zustand": "4.4.7",
    "jotai": "2.6.0",
    "swr": "2.2.4"
  }
}
```

### Utilidades y Helpers
```json
{
  "dependencies": {
    "date-fns": "2.30.0",
    "axios": "1.6.2",
    "zod": "3.22.4",
    "lodash": "4.17.21"
  }
}
```

### Dev Dependencies
```json
{
  "devDependencies": {
    "@types/node": "20.10.5",
    "@types/react": "18.2.45",
    "@types/react-dom": "18.2.18",
    "autoprefixer": "10.4.16",
    "postcss": "8.4.32",
    "eslint": "8.56.0",
    "eslint-config-next": "14.0.4",
    "prettier": "3.1.1",
    "prettier-plugin-tailwindcss": "0.5.9"
  }
}
```

### Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  }
}
```

### Configuración de Node
```json
{
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.6.7"
  }
}
```

### Notas de Compatibilidad
- Next.js 14 requiere Node.js 18.17 o superior
- Todas las dependencias están fijadas a versiones específicas para evitar problemas de compatibilidad
- Se han testeado y verificado todas las integraciones entre paquetes
- Las versiones de wagmi y viem están sincronizadas para evitar conflictos
- shadcn/ui componentes son compatibles con las versiones especificadas de Radix UI

### Proceso de Actualización
1. **NO actualizar paquetes individualmente**
2. Usar el script de actualización proporcionado:
```bash
npm run update-deps
```

Este script:
- Verifica compatibilidad entre paquetes
- Actualiza en conjunto las dependencias relacionadas
- Ejecuta tests de integración
- Genera un reporte de cambios

## 🛠 Stack Tecnológico
- **Frontend**:
  - Next.js 14 (App Router)
  - TypeScript
  - TailwindCSS
  - shadcn/ui (componentes)

- **Blockchain Integration**:
  - Web3.js
  - @solana/web3.js
  - Ethers.js

- **APIs y Servicios**:
  - Solscan/Birdeye (Solana)
  - Etherscan
  - BSCScan
  - APIs de DEX relevantes

## ⚙️ Conexiones Blockchain

### RPCs Públicos (No requieren API key)
```env
# Ethereum
NEXT_PUBLIC_ETHEREUM_RPC=https://eth.llamarpc.com

# BSC
NEXT_PUBLIC_BSC_RPC=https://bsc-dataseed1.binance.org

# Polygon
NEXT_PUBLIC_POLYGON_RPC=https://polygon-rpc.com

# Solana
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
```

### RPCs Privados (Opcionales - Mejor rendimiento)
```env
# Alchemy (https://alchemy.com)
NEXT_PUBLIC_ALCHEMY_ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Infura (https://infura.io)
NEXT_PUBLIC_INFURA_ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_KEY

# QuickNode (https://quicknode.com)
NEXT_PUBLIC_QUICKNODE_BSC_RPC=YOUR_QUICKNODE_BSC_URL
```

### APIs Necesarias para Metadata
```env
# Exploradores de Blockchain (https://etherscan.io, etc)
ETHERSCAN_API_KEY=your_etherscan_key        # Metadata y verificación de contratos
BSCSCAN_API_KEY=your_bscscan_key            # Metadata y verificación de contratos
POLYGONSCAN_API_KEY=your_polygonscan_key    # Metadata y verificación de contratos

# Solana (Opcionales - Para datos adicionales)
SOLSCAN_API_KEY=your_solscan_key            # Metadata detallada
BIRDEYE_API_KEY=your_birdeye_key            # Precios en tiempo real
```

### Límites y Recomendaciones
- **RPCs Públicos**:
  - Límite: ~30-50 requests/segundo
  - Pueden ser inestables en momentos de alta carga
  - Recomendados solo para desarrollo

- **RPCs Privados**:
  - Límite: Según plan (100-1000+ requests/segundo)
  - Conexiones WebSocket disponibles
  - Recomendados para producción

- **APIs de Exploradores**:
  - Etherscan Free: 5 calls/segundo
  - BSCScan Free: 5 calls/segundo
  - Solscan Free: 30 calls/minuto

## 📁 Estructura del Proyecto
```
src/
├── app/                    # App router y páginas
├── components/             # Componentes React
│   ├── ui/                # Componentes de interfaz
│   └── blockchain/        # Componentes específicos de blockchain
├── lib/                   # Utilidades y configuraciones
│   ├── constants/         # Constantes y configuración
│   ├── hooks/            # Custom hooks
│   └── utils/            # Funciones utilitarias
└── services/             # Servicios externos
    └── blockchain/       # Integraciones blockchain
```

## 📋 Requisitos del Sistema
- Node.js >= 18.0.0
- NPM >= 9.0.0
- Memoria: 4GB RAM mínimo
- Almacenamiento: 1GB disponible

## 🔧 Configuración y Desarrollo
1. Clonar el repositorio
```bash
git clone [repo-url]
cd memescanner
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus claves
```

4. Iniciar desarrollo
```bash
npm run dev
```

## 🧪 Testing
```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Verificar tipos
npm run type-check
```

## 🐛 Troubleshooting

### Problemas Comunes
1. **Error: Network Connection Failed**
   - Verificar RPC endpoints
   - Comprobar límites de rate
   - Usar VPN si es necesario

2. **Error: API Key Invalid**
   - Verificar formato de API keys
   - Comprobar límites de uso
   - Regenerar keys si es necesario

### Soporte
- GitHub Issues: [link]
- Discord: [link]
- Email: support@memescanner.com

## 📈 Roadmap
1. **Fase 1** (Q1 2024): 
   - Setup inicial y soporte Solana
   - Implementación de criterios básicos
   - UI/UX básica

2. **Fase 2** (Q2 2024): 
   - Integración multi-chain
   - Sistema de scoring
   - Análisis de contratos

3. **Fase 3** (Q3 2024): 
   - Sistema de alertas
   - Análisis social
   - API pública

4. **Fase 4** (Q4 2024): 
   - Machine Learning para detección
   - Predicciones automáticas
   - Dashboard avanzado

## 🔐 Seguridad y Limitaciones
- Rate limits en APIs: 5 calls/segundo
- Máximo de tokens monitoreados: 1000/chain
- Tiempo mínimo de análisis: 24h
- Refresh rate de datos: 5 minutos

## 🤝 Contribución
Las contribuciones son bienvenidas. Por favor, revisa las guías de contribución antes de empezar.

## 📄 Licencia
MIT License

## 📝 Estado del Desarrollo UI

### Componentes Principales
- [x] Header completo
  - [x] Selector de red (Ethereum, BSC, etc.)
  - [x] Selector tema claro/oscuro
  - [ ] Conectar wallet
  - [ ] Menú de navegación

### Componentes Avanzados
- [ ] Tablas ordenables y filtrables
- [ ] Gráficos de velas (TradingView)
- [ ] Heatmaps de actividad
- [ ] Indicadores técnicos

### Estados de Carga
- [ ] Skeletons para datos
- [ ] Spinners para acciones
- [ ] Progress bars para procesos
- [ ] Placeholders para imágenes

### Animaciones y Transiciones
- [x] Transiciones de tema
- [ ] Fade in/out de elementos
- [ ] Slide para drawers
- [ ] Scale para modales
- [x] Microinteracciones (hover states)

### Accesibilidad
- [ ] WCAG 2.1 AA compliant
- [ ] Soporte para lectores de pantalla
- [ ] Navegación por teclado
- [ ] Etiquetas ARIA
