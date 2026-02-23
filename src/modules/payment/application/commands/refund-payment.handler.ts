import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RefundPaymentCommand } from './refund-payment.command';
import { PaymentRefundedEvent } from '../../domain/events/payment-refunded.event';
import {
  EVENT_STORE_REPOSITORY,
  EventStoreRepository,
} from '../ports/event-store-repository.interface';
import {
  WALLET_REPOSITORY,
  WalletRepository,
} from '../ports/wallet-repository.interface';
import { Result } from '../../../../shared/domain/result';

/**
 * RefundPaymentHandler
 *
 * Procesa la solicitud de reembolso. Valida que el pago exista,
 * que no haya sido cancelado previamente, y genera un evento
 * PaymentRefunded que devuelve el monto a la wallet original.
 *
 * Flujo:
 *   Command → Buscar evento original → Validar estado → Crear evento → Append → Publicar
 */
@CommandHandler(RefundPaymentCommand)
export class RefundPaymentHandler implements ICommandHandler<RefundPaymentCommand> {
  private readonly logger = new Logger(RefundPaymentHandler.name);

  constructor(
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefundPaymentCommand): Promise<Result<string>> {
    // ─── 1. Buscar el evento original del pago ───────────────
    const originalEvent = await this.eventStore.findEventByPaymentId(
      command.paymentId,
    );

    if (!originalEvent) {
      return Result.fail(`Pago ${command.paymentId} no encontrado`);
    }

    const paymentData = originalEvent.eventData;
    const walletId = paymentData['walletId'] as string;

    // ─── 2. Verificar que no esté ya cancelado o reembolsado ─
    const walletEvents = await this.eventStore.getEvents(walletId);
    const alreadyProcessed = walletEvents.some(
      (e) =>
        (e.eventType === 'PaymentCancelled' ||
          e.eventType === 'PaymentRefunded') &&
        e.eventData['paymentId'] === command.paymentId,
    );

    if (alreadyProcessed) {
      return Result.fail(
        `Pago ${command.paymentId} ya fue cancelado o reembolsado`,
      );
    }

    // ─── 3. Reconstruir saldo actual ─────────────────────────
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      return Result.fail(`Wallet ${walletId} no encontrada`);
    }

    const amount = paymentData['amount'] as number;
    const currency = paymentData['currency'] as string;
    const previousBalance = wallet.getBalance();
    const newBalance = previousBalance + amount;

    // ─── 4. Crear evento de reembolso ────────────────────────
    const event = new PaymentRefundedEvent(
      command.paymentId,
      walletId,
      amount,
      currency,
      command.reason,
      previousBalance,
      newBalance,
    );

    // ─── 5. APPEND al Event Store ────────────────────────────
    await this.eventStore.append(walletId, 'Wallet', 'PaymentRefunded', {
      paymentId: event.paymentId,
      walletId: event.walletId,
      amount: event.amount,
      currency: event.currency,
      reason: event.reason,
      previousBalance: event.previousBalance,
      newBalance: event.newBalance,
    });

    this.logger.log(
      `Evento guardado: PaymentRefunded | payment=${command.paymentId} | wallet=${walletId}`,
    );

    // ─── 6. Publicar evento ──────────────────────────────────
    this.eventBus.publish(event);

    return Result.ok(command.paymentId);
  }
}
