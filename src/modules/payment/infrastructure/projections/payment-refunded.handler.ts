import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { PaymentRefundedEvent } from '../../domain/events/payment-refunded.event';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import {
  PAYMENT_READ_REPOSITORY,
  PaymentReadRepository,
} from '../../application/ports/payment-read-repository.interface';

/**
 * PaymentRefundedProjection
 *
 * Escucha el evento PaymentRefunded y actualiza la base
 * de datos de LECTURA: marca el pago como REFUNDED
 * y restaura el saldo de la wallet.
 */
@EventsHandler(PaymentRefundedEvent)
export class PaymentRefundedProjection implements IEventHandler<PaymentRefundedEvent> {
  private readonly logger = new Logger(PaymentRefundedProjection.name);

  constructor(
    @Inject(PAYMENT_READ_REPOSITORY)
    private readonly paymentReadRepository: PaymentReadRepository,
  ) {}

  async handle(event: PaymentRefundedEvent): Promise<void> {
    this.logger.log(
      `Proyectando: PaymentRefunded | payment=${event.paymentId}`,
    );

    await this.paymentReadRepository.updateStatus(
      event.paymentId,
      PaymentStatus.REFUNDED,
    );

    this.logger.log(
      `Proyección actualizada: wallet=${event.walletId} | ` +
        `balance=${event.previousBalance} → ${event.newBalance} | status=REFUNDED`,
    );
  }
}
