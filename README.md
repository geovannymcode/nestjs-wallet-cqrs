# NestJS Wallet CQRS + Event Sourcing

Demo project for **BAQ.js Meetup** — Demonstrates CQRS and Event Sourcing patterns applied to a digital wallet payment system using NestJS.

## Architecture

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│   COMMAND    │────▶│  Event Store │
│  (POST)  │     │   Handler    │     │ (append-only)│
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                                             ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│    QUERY     │────▶│   Read DB    │◀── Event Handler
│  (GET)   │     │   Handler    │     │ (proyección) │    (async)
└──────────┘     └──────────────┘     └──────────────┘
```

**Key principle:** Commands write to the Event Store (INSERT only). Event Handlers update the Read DB asynchronously. Queries read from the Read DB. Zero deadlocks.

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── shared/
│   └── domain/result.ts
└── modules/
    └── payment/
        ├── payment.module.ts
        ├── application/
        │   ├── commands/
        │   │   ├── process-payment.command.ts
        │   │   ├── process-payment.handler.ts      ← KEY FILE 1
        │   │   └── process-payment.handler.spec.ts
        │   ├── queries/
        │   │   ├── get-payment-history.query.ts
        │   │   └── get-payment-history.handler.ts
        │   └── ports/
        │       ├── event-store-repository.interface.ts
        │       └── wallet-repository.interface.ts
        ├── domain/
        │   ├── entities/
        │   │   ├── wallet.entity.ts
        │   │   └── wallet.entity.spec.ts
        │   └── events/
        │       └── payment-processed.event.ts
        ├── infrastructure/
        │   ├── repositories/
        │   │   ├── event-store.repository.impl.ts   ← KEY FILE 2
        │   │   └── wallet.repository.impl.ts
        │   └── projections/
        │       └── payment-processed.handler.ts     ← KEY FILE 3
        └── presentation/
            ├── controllers/payment.controller.ts
            └── dto/process-payment.dto.ts
```

## Quick Start

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Run in dev mode
npm run start:dev
```

## API Endpoints

### Process Payment (Command Side)
```bash
POST http://localhost:3000/payments
{
  "walletId": "WAL-001",
  "amount": 500,
  "currency": "USD",
  "recipientWalletId": "WAL-002",
  "concept": "Transfer to friend"
}
```

### Get Payment History (Query Side)
```bash
GET http://localhost:3000/payments/history/WAL-001?limit=10
```

## Running Tests

```bash
npm test
```

## Author

**Geovanny Mendoza** — [geovannycode.com](https://geovannycode.com)
