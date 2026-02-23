import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Presentation
import { PaymentController } from './presentation/controllers/payment.controller';

// Application - Commands
import { ProcessPaymentHandler } from './application/commands/process-payment.handler';
import { CancelPaymentHandler } from './application/commands/cancel-payment.handler';
import { RefundPaymentHandler } from './application/commands/refund-payment.handler';

// Application - Queries
import { GetPaymentHistoryHandler } from './application/queries/get-payment-history.handler';
import { GetPaymentByIdHandler } from './application/queries/get-payment-by-id.handler';
import { ListPaymentsHandler } from './application/queries/list-payments.handler';

// Infrastructure - Repositories
import { EventStoreRepositoryImpl } from './infrastructure/repositories/event-store.repository.impl';
import { WalletRepositoryImpl } from './infrastructure/repositories/wallet.repository.impl';
import { PaymentReadRepositoryImpl } from './infrastructure/repositories/payment-read.repository.impl';

// Infrastructure - Projections (Event Handlers)
import { PaymentProcessedHandler } from './infrastructure/projections/payment-processed.handler';
import { PaymentCancelledProjection } from './infrastructure/projections/payment-cancelled.handler';
import { PaymentRefundedProjection } from './infrastructure/projections/payment-refunded.handler';

// Ports (injection tokens)
import { EVENT_STORE_REPOSITORY } from './application/ports/event-store-repository.interface';
import { WALLET_REPOSITORY } from './application/ports/wallet-repository.interface';
import { PAYMENT_READ_REPOSITORY } from './application/ports/payment-read-repository.interface';

/** CQRS Command Handlers */
const CommandHandlers = [ProcessPaymentHandler, CancelPaymentHandler, RefundPaymentHandler];

/** CQRS Query Handlers */
const QueryHandlers = [GetPaymentHistoryHandler, GetPaymentByIdHandler, ListPaymentsHandler];

/** Event Handlers (Projections) */
const EventHandlers = [PaymentProcessedHandler, PaymentCancelledProjection, PaymentRefundedProjection];

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
    {
      provide: PAYMENT_READ_REPOSITORY,
      useClass: PaymentReadRepositoryImpl,
    },
  ],
})
export class PaymentModule {}
