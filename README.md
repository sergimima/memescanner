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

## 🎨 Interfaz de Usuario y Desarrollo Frontend

### Stack Principal
- **Next.js 14**: Framework base (requiere Node.js 18.17 o superior)
- **TailwindCSS**: Sistema de estilos y utilidades CSS
- **shadcn/ui**: Componentes base con Radix UI
- **CSS Modules**: Estilos específicos por componente
- **CSS Variables**: Sistema de tematización

### Componentes y Estructura
- **Componentes Base**: Implementación de shadcn/ui
  - Dialog
  - DropdownMenu
  - Tabs
  - Card
  - Button
  - Input
  - Select
  - Toast
  - Tooltip

- **Estructura de Componentes**:
  ```
  src/
   ├── app/                    # App Router (Next.js 14)
   │   ├── (auth)/            # Rutas protegidas
   │   ├── (public)/          # Rutas públicas
   │   ├── api/               # API Routes
   │   └── layout.tsx         # Root layout
   │
   ├── components/            # Componentes React
   │   ├── ui/               # Componentes base (shadcn)
   │   ├── icons/          # Iconos del sistema
   │   ├── layout/         # Componentes de layout
   │   ├── providers/      # Providers de React
   │   ├── token/          # Componentes específicos de tokens
   │   ├── wallet/         # Componentes de wallet
   │   ├── error-boundary.tsx
   │   ├── network-selector.tsx
   │   ├── theme-provider.tsx
   │   ├── theme-toggle.tsx
   │   ├── token-updates.tsx
   │   └── websocket-status.tsx
   │
   ├── config/              # Configuraciones
   │   └── ...            # Archivos de configuración
   │
   ├── features/           # Lógica de negocio principal
   │   ├── network/       # Gestión de redes blockchain
   │   └── tokens/        # Gestión de tokens y lógica relacionada
   │
   ├── lib/               # Utilidades y helpers
   │   └── ...          # Funciones utilitarias
   │
   ├── types/             # Definiciones de TypeScript
   │   └── ...          # Tipos y interfaces
   │
   └── utils/             # Utilidades generales
       └── ...          # Funciones de utilidad

```

### Performance y Optimización
- **Lazy Loading**: Carga diferida de componentes pesados
- **Image Optimization**: Next/Image para optimización automática
- **Bundle Size**: Monitoreo y optimización del tamaño del bundle
- **Code Splitting**: División automática del código por rutas

### Estados de UI
- **Loading States**:
  - Skeletons para datos en carga
  - Spinners para acciones
  - Progress bars para procesos
  - Placeholders para imágenes

### Compatibilidad y Dependencias
- Versiones específicas de Radix UI components
- TailwindCSS y plugins configurados
- Sistema de temas claro/oscuro
- Responsive design para múltiples dispositivos

## 🛠 Stack Tecnológico
- **Frontend**:
  - Next.js 14
  - React 18
  - TypeScript
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
├── app/                    # App Router (Next.js 14)
├── components/            # Componentes React
│   ├── ui/              # Componentes base (shadcn)
│   ├── icons/          # Iconos del sistema
│   ├── layout/         # Componentes de layout
│   ├── providers/      # Providers de React
│   ├── token/          # Componentes específicos de tokens
│   ├── wallet/         # Componentes de wallet
│   ├── error-boundary.tsx
│   ├── network-selector.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── token-updates.tsx
│   └── websocket-status.tsx
│
├── config/              # Configuraciones
│   └── ...            # Archivos de configuración
│
├── features/           # Lógica de negocio principal
│   ├── network/       # Gestión de redes blockchain
│   └── tokens/        # Gestión de tokens y lógica relacionada
│
├── lib/               # Utilidades y helpers
│   └── ...          # Funciones utilitarias
│
├── types/             # Definiciones de TypeScript
│   └── ...          # Tipos y interfaces
│
└── utils/             # Utilidades generales
    └── ...          # Funciones de utilidad

```

### 📝 Organización del Código

1. **Componentes**:
   - `components/ui/`: Componentes base de shadcn/ui
   - `components/token/`: Componentes específicos para visualización de tokens
   - `components/wallet/`: Componentes relacionados con la wallet
   - Componentes individuales en la raíz para funcionalidades específicas

2. **Features**:
   - `network/`: Todo lo relacionado con la gestión de redes blockchain
   - `tokens/`: Lógica central de la aplicación para el tracking de tokens

3. **Utilidades y Configuración**:
   - `config/`: Configuraciones globales
   - `lib/`: Funciones helper y utilidades
   - `utils/`: Utilidades generales
   - `types/`: Definiciones de tipos TypeScript

### 🔍 Convenciones de Código

- **Componentes**: PascalCase (ej: `TokenCard.tsx`)
- **Hooks**: camelCase con prefix 'use' (ej: `useTokens.ts`)
- **Utilidades**: camelCase (ej: `formatAddress.ts`)
- **Tipos**: PascalCase con suffix relevante (ej: `TokenType.ts`)

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
  - [x] Conectar wallet (Web3Modal v4)
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

```
