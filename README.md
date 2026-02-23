# NestJS Wallet CQRS + Event Sourcing

Proyecto demo para **BAQ.js Meetup** — Demuestra los patrones CQRS y Event Sourcing aplicados a un sistema de pagos de wallet digital usando NestJS.

## Arquitectura

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│   COMMAND    │────▶│  Event Store │
│  (POST)  │     │   Handler    │     │ (append-only)│
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │ Evento publicado
                                             ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│    QUERY     │────▶│   Read DB    │◀── Event Handler
│  (GET)   │     │   Handler    │     │ (proyección) │    (async)
└──────────┘     └──────────────┘     └──────────────┘
```

**Principio clave:** Los Commands escriben en el Event Store (solo INSERT). Los Event Handlers actualizan la Read DB de forma asíncrona. Las Queries leen de la Read DB. Cero deadlocks.

## Tech Stack

- **NestJS 11** — Framework principal
- **@nestjs/cqrs** — Implementación de CQRS + Event Bus
- **PostgreSQL 17** — Event Store + Read Models
- **pg** — Driver nativo de PostgreSQL
- **class-validator / class-transformer** — Validación de DTOs
- **Docker Compose** — Infraestructura local
- **Jest** — Testing unitario
- **SWC** — Compilación rápida

## Estructura del Proyecto

```
src/
├── app.module.ts
├── main.ts
├── shared/
│   └── domain/
│       └── result.ts                          # Result pattern para manejo de errores
└── modules/
    └── payment/
        ├── payment.module.ts                  # Módulo principal con DI
        │
        ├── application/
        │   ├── commands/
        │   │   ├── process-payment.command.ts
        │   │   ├── process-payment.handler.ts       # Procesar pago
        │   │   ├── process-payment.handler.spec.ts
        │   │   ├── cancel-payment.command.ts
        │   │   ├── cancel-payment.handler.ts        # Cancelar pago
        │   │   ├── cancel-payment.handler.spec.ts
        │   │   ├── refund-payment.command.ts
        │   │   ├── refund-payment.handler.ts        # Reembolsar pago
        │   │   └── refund-payment.handler.spec.ts
        │   ├── queries/
        │   │   ├── get-payment-history.query.ts
        │   │   ├── get-payment-history.handler.ts   # Historial de eventos
        │   │   ├── get-payment-by-id.query.ts
        │   │   ├── get-payment-by-id.handler.ts     # Obtener pago por ID
        │   │   ├── list-payments.query.ts
        │   │   └── list-payments.handler.ts         # Listar pagos con filtros
        │   └── ports/
        │       ├── event-store-repository.interface.ts
        │       ├── wallet-repository.interface.ts
        │       └── payment-read-repository.interface.ts
        │
        ├── domain/
        │   ├── entities/
        │   │   ├── wallet.entity.ts
        │   │   └── wallet.entity.spec.ts
        │   ├── enums/
        │   │   └── payment-status.enum.ts
        │   └── events/
        │       ├── payment-processed.event.ts
        │       ├── payment-cancelled.event.ts
        │       └── payment-refunded.event.ts
        │
        ├── infrastructure/
        │   ├── repositories/
        │   │   ├── event-store.repository.impl.ts   # Event Store (append-only)
        │   │   ├── wallet.repository.impl.ts        # Reconstrucción de Wallet
        │   │   └── payment-read.repository.impl.ts  # Read Model de pagos
        │   └── projections/
        │       ├── payment-processed.handler.ts     # Proyección: pago procesado
        │       ├── payment-cancelled.handler.ts     # Proyección: pago cancelado
        │       └── payment-refunded.handler.ts      # Proyección: pago reembolsado
        │
        └── presentation/
            ├── controllers/
            │   └── payment.controller.ts
            └── dto/
                ├── process-payment.dto.ts
                ├── cancel-payment.dto.ts
                ├── refund-payment.dto.ts
                └── list-payments.dto.ts
```

## Quick Start

```bash
# 1. Levantar PostgreSQL con Docker
docker-compose up -d

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run start:dev
```

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Modo desarrollo con hot-reload |
| `npm run start:prod` | Modo producción |
| `npm test` | Ejecutar tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con cobertura |
| `npm run docker:up` | Levantar PostgreSQL |
| `npm run docker:down` | Detener PostgreSQL |
| `npm run docker:reset` | Resetear BD (borra datos) |
| `npm run demo:start` | Reset BD + iniciar servidor |

## API Endpoints

### Commands (Write Side)

#### Procesar Pago
```bash
POST http://localhost:3000/payments
Content-Type: application/json

{
  "walletId": "WAL-001",
  "amount": 500,
  "currency": "USD",
  "recipientWalletId": "WAL-002",
  "concept": "Transferencia a amigo"
}
```

#### Cancelar Pago
```bash
POST http://localhost:3000/payments/{paymentId}/cancel
Content-Type: application/json

{
  "reason": "Pago duplicado"
}
```

#### Reembolsar Pago
```bash
POST http://localhost:3000/payments/{paymentId}/refund
Content-Type: application/json

{
  "reason": "Solicitud del cliente"
}
```

### Queries (Read Side)

#### Listar Pagos (con filtros y paginación)
```bash
GET http://localhost:3000/payments?walletId=WAL-001&status=PROCESSED&page=1&limit=20
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `walletId` | string | No | Filtrar por wallet |
| `status` | string | No | `PROCESSED`, `CANCELLED`, `REFUNDED` |
| `page` | number | No | Página (default: 1) |
| `limit` | number | No | Resultados por página (default: 20, max: 100) |

#### Obtener Pago por ID
```bash
GET http://localhost:3000/payments/{paymentId}
```

#### Historial de Eventos de una Wallet
```bash
GET http://localhost:3000/payments/history/{walletId}?limit=10
```

#### Health Check
```bash
GET http://localhost:3000/payments/health
```

## Base de Datos

El proyecto usa **dos modelos de datos separados** siguiendo el patrón CQRS:

### Write Side — Event Store (append-only)
```sql
event_store (id, aggregate_id, aggregate_type, event_type, event_data, occurred_at, version)
```

### Read Side — Proyecciones (actualizadas async)
```sql
wallets_read_model  (wallet_id, owner_id, balance, currency, updated_at)
payments_read_model (payment_id, wallet_id, amount, currency, recipient_wallet_id, concept, status, created_at)
```

### Datos de Demo

La BD se inicializa con 3 wallets de prueba:

| Wallet ID | Owner | Balance |
|-----------|-------|---------|
| `WAL-001` | USER-001 | $10,000.00 |
| `WAL-002` | USER-002 | $5,000.00 |
| `WAL-003` | USER-003 | $250.00 |

## Postman

Importa el archivo `payment-service-postman-collection.json` en Postman para probar todos los endpoints. La colección incluye las variables `baseUrl` y `paymentId`.

## Flujo de Prueba Sugerido

1. **Health Check** — Verificar que el servicio esté arriba
2. **Process Payment** — Crear un pago (`WAL-001` → `WAL-002`)
3. **Get Payment By Id** — Consultar el pago creado con el ID retornado
4. **List Payments** — Listar pagos filtrando por `walletId=WAL-001`
5. **Cancel Payment** o **Refund Payment** — Cancelar o reembolsar el pago
6. **Get Payment History** — Ver todos los eventos de `WAL-001`

## Tests

```bash
# Unitarios
npm test

# Con cobertura
npm run test:cov

# Watch mode
npm run test:watch
```

## Autor

**Geovanny Mendoza** — [geovannycode.com](https://geovannycode.com)
