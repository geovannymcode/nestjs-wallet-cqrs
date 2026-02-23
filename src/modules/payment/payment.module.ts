import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Presentation
import { PaymentController } from './presentation/controllers/payment.controller';

// Application - Commands
import { ProcessPaymentHandler } from './application/commands/process-payment.handler';

// Application - Queries
import { GetPaymentHistoryHandler } from './application/queries/get-payment-history.handler';

// Infrastructure - Repositories
import { EventStoreRepositoryImpl } from './infrastructure/repositories/event-store.repository.impl';
import { WalletRepositoryImpl } from './infrastructure/repositories/wallet.repository.impl';

// Infrastructure - Projections (Event Handlers)
import { PaymentProcessedHandler } from './infrastructure/projections/payment-processed.handler';

// Ports (injection tokens)
import { EVENT_STORE_REPOSITORY } from './application/ports/event-store-repository.interface';
import { WALLET_REPOSITORY } from './application/ports/wallet-repository.interface';

/** CQRS Command Handlers */
const CommandHandlers = [ProcessPaymentHandler];

/** CQRS Query Handlers */
const QueryHandlers = [GetPaymentHistoryHandler];

/** Event Handlers (Projections) */
const EventHandlers = [PaymentProcessedHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PaymentController],
  providers: [
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,

    // Repositories (inyectados por interfaz)
    {
      provide: EVENT_STORE_REPOSITORY,
      useClass: EventStoreRepositoryImpl,
    },
    {
      provide: WALLET_REPOSITORY,
      useClass: WalletRepositoryImpl,
    },
  ],
})
export class PaymentModule {}
