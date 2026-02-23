import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { PaymentCancelledEvent } from '../../domain/events/payment-cancelled.event';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import {
  PAYMENT_READ_REPOSITORY,
  PaymentReadRepository,
} from '../../application/ports/payment-read-repository.interface';

/**
 * PaymentCancelledProjection
 *
 * Escucha el evento PaymentCancelled y actualiza la base
 * de datos de LECTURA: marca el pago como CANCELLED
 * y restaura el saldo de la wallet.
 */
@EventsHandler(PaymentCancelledEvent)
export class PaymentCancelledProjection implements IEventHandler<PaymentCancelledEvent> {
  private readonly logger = new Logger(PaymentCancelledProjection.name);

  constructor(
    @Inject(PAYMENT_READ_REPOSITORY)
    private readonly paymentReadRepository: PaymentReadRepository,
  ) {}

  async handle(event: PaymentCancelledEvent): Promise<void> {
    this.logger.log(
      `Proyectando: PaymentCancelled | payment=${event.paymentId}`,
    );

    await this.paymentReadRepository.updateStatus(
      event.paymentId,
      PaymentStatus.CANCELLED,
    );

    this.logger.log(
      `Proyección actualizada: wallet=${event.walletId} | ` +
        `balance=${event.previousBalance} → ${event.newBalance} | status=CANCELLED`,
    );
  }
}
