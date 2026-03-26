# NestJS Wallet CQRS + Event Sourcing + Kafka

Proyecto demo para **BAQ.js Meetup** — Demuestra los patrones CQRS y Event Sourcing aplicados a un sistema de pagos de wallet digital usando NestJS y **Apache Kafka** como Event Source distribuido.

## Arquitectura

```
                    ┌─── COMMAND SIDE ───┐                   ┌─── QUERY SIDE ───┐
                    │                    │                   │                  │
┌──────────┐  POST  │ ┌────────────────┐ │   ┌────────────┐  │ ┌──────────────┐ │  GET   ┌──────────┐
│  Client  │───────▶│ │ Command Handler│─┼──▶│ Event Store│  │ │  Read Model  │─┼───────▶│  Client  │
│          │        │ │ (Process/      │ │   │ (PG append)│  │ │  (PG tables) │ │        │          │
└──────────┘        │ │  Cancel/Refund)│ │   └────────────┘  │ └──────▲───────┘ │        └──────────┘
                    │ └───────┬────────┘ │                   │        │         │
                    └─────────┼──────────┘                   └────────┼─────────┘
                              │ produce                               │ consume
                              ▼                                       │
                    ┌─────────────────────────────────────────────────┐
                    │              Apache Kafka                       │
                    │  Topics: payment_processed | payment_cancelled  │
                    │           payment_refunded                      │
                    │                                                 │
                    │  Kafdrop UI → http://localhost:9000             │
                    └─────────────────────────────────────────────────┘
```

**Principio clave:** Los Commands escriben en el Event Store (solo INSERT) y **producen eventos a Kafka**. El Projection Consumer **consume desde Kafka** y actualiza la Read DB de forma asíncrona. Las Queries leen de la Read DB. Kafka garantiza persistencia y desacoplamiento entre el write-side y el read-side.

## Tech Stack

- **NestJS 11** — Framework principal
- **@nestjs/cqrs** — Implementación de CQRS + Event Bus
- **Apache Kafka** — Event Source distribuido (vía kafkajs)
- **Kafdrop** — UI web para visualizar eventos en Kafka en tiempo real
- **PostgreSQL 17** — Event Store + Read Models
- **pg** — Driver nativo de PostgreSQL
- **class-validator / class-transformer** — Validación de DTOs
- **Docker Compose** — Infraestructura local (PostgreSQL + Kafka + Kafdrop)
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
    ├── kafka/                                 # Módulo Kafka (Event Source distribuido)
    │   ├── kafka.module.ts                    # Exporta Producer + Consumer
    │   ├── kafka.topics.ts                    # Constantes de topics
    │   ├── producer/
    │   │   └── producer.service.ts            # Produce eventos a Kafka
    │   └── consumer/
    │       ├── consumer.service.ts            # Consumer genérico de Kafka
    │       └── projection-consumer.service.ts # Consume eventos → actualiza Read DB
    │
    └── payment/
        ├── payment.module.ts                  # Módulo principal con DI
        │
        ├── application/
        │   ├── commands/
        │   │   ├── process-payment.command.ts
        │   │   ├── process-payment.handler.ts       # Procesar pago → Kafka
        │   │   ├── process-payment.handler.spec.ts
        │   │   ├── cancel-payment.command.ts
        │   │   ├── cancel-payment.handler.ts        # Cancelar pago → Kafka
        │   │   ├── cancel-payment.handler.spec.ts
        │   │   ├── refund-payment.command.ts
        │   │   ├── refund-payment.handler.ts        # Reembolsar pago → Kafka
        │   │   └── refund-payment.handler.spec.ts
        │   ├── queries/
        │   │   ├── get-payment-history.query.ts
        │   │   ├── get-payment-history.handler.ts   # Historial de eventos
        │   │   ├── get-payment-by-id.query.ts
        │   │   ├── get-payment-by-id.handler.ts     # Obtener pago por ID
        │   │   ├── list-payments.query.ts
        │   │   ├── list-payments.handler.ts         # Listar pagos con filtros
        │   │   ├── list-wallets.query.ts
        │   │   └── list-wallets.handler.ts          # Listar wallets disponibles
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
            │   ├── payment.controller.ts
            │   └── wallet.controller.ts             # GET /wallets
            └── dto/
                ├── process-payment.dto.ts
                ├── cancel-payment.dto.ts
                ├── refund-payment.dto.ts
                └── list-payments.dto.ts
```

## Quick Start

```bash
# 1. Levantar PostgreSQL + Kafka + Kafdrop con Docker
docker-compose up -d

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run start:dev

# 4. Abrir Kafdrop para ver eventos en tiempo real
# http://localhost:9000
```

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Modo desarrollo con hot-reload |
| `npm run start:prod` | Modo producción |
| `npm test` | Ejecutar tests unitarios |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:cov` | Tests con cobertura |
| `npm run docker:up` | Levantar PostgreSQL + Kafka + Kafdrop |
| `npm run docker:down` | Detener todos los contenedores |
| `npm run docker:reset` | Resetear BD y Kafka (borra datos) |
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

#### Listar Wallets
```bash
GET http://localhost:3000/wallets
```

Respuesta:
```json
[
  {
    "walletId": "WAL-001",
    "ownerName": "Geovanny Mendoza",
    "balance": 10000,
    "currency": "USD",
    "avatar": "👨"
  }
]
```

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
wallets_read_model  (wallet_id, owner_id, owner_name, balance, currency, updated_at)
payments_read_model (payment_id, wallet_id, amount, currency, recipient_wallet_id, concept, status, created_at)
```

### Datos de Demo

La BD se inicializa con 5 wallets de prueba:

| Wallet ID | Owner Name | Balance |
|-----------|------------|---------|
| `WAL-001` | Geovanny Mendoza | $10,000.00 |
| `WAL-002` | Luis Porras | $5,000.00 |
| `WAL-003` | Jesus Viloria | $250.00 |
| `WAL-004` | Kelly Villa | $8,000.00 |
| `WAL-005` | Giselle Ulloa | $3,500.00 |

## Postman

Importa el archivo `payment-service-postman-collection.json` en Postman para probar todos los endpoints. La colección incluye las variables `baseUrl` y `paymentId`.

## CORS

El backend tiene CORS habilitado (`app.enableCors()`) para permitir consumo desde un frontend (e.g. Hilla/Vaadin en `localhost:8080`).

## Flujo de Prueba Sugerido

1. **Health Check** — Verificar que el servicio esté arriba
2. **List Wallets** — Obtener las wallets disponibles
3. **Process Payment** — Crear un pago (`WAL-001` → `WAL-002`)
4. **Abrir Kafdrop** — Ver el evento `payment_processed` en http://localhost:9000
5. **Get Payment By Id** — Consultar el pago creado con el ID retornado
6. **List Payments** — Listar pagos filtrando por `walletId=WAL-001`
7. **Cancel Payment** o **Refund Payment** — Cancelar o reembolsar el pago
8. **Kafdrop** — Ver los eventos `payment_cancelled` / `payment_refunded` en Kafka
9. **Get Payment History** — Ver todos los eventos de `WAL-001`

## Kafka: Flujo de Eventos

Cada operación de escritura (Command) produce un evento a Kafka:

| Operación | Topic Kafka | Datos del Evento |
|-----------|-------------|------------------|
| Procesar pago | `payment_processed` | paymentId, walletId, amount, currency, recipientWalletId, concept, balances |
| Cancelar pago | `payment_cancelled` | paymentId, walletId, amount, currency, reason, balances |
| Reembolsar pago | `payment_refunded` | paymentId, walletId, amount, currency, reason, balances |

El `ProjectionConsumerService` consume estos eventos y actualiza la base de datos de lectura (Read Model) de forma asíncrona.

### Kafdrop (UI para Kafka)

Accede a **http://localhost:9000** para:
- Ver los topics creados automáticamente
- Inspeccionar mensajes individuales
- Monitorear particiones y offsets
- Verificar el consumer group `wallet-projection-group`

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
