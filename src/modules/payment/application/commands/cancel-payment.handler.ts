import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CancelPaymentCommand } from './cancel-payment.command';
import { PaymentCancelledEvent } from '../../domain/events/payment-cancelled.event';
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
 * CancelPaymentHandler
 *
 * Recibe el comando de cancelación, valida que el pago exista
 * y no haya sido ya cancelado/reembolsado, luego genera un
 * evento PaymentCancelled y lo persiste en el Event Store.
 *
 * Flujo:
 *   Command → Buscar evento original → Validar estado → Crear evento → Append → Publicar
 */
@CommandHandler(CancelPaymentCommand)
export class CancelPaymentHandler implements ICommandHandler<CancelPaymentCommand> {
  private readonly logger = new Logger(CancelPaymentHandler.name);

  constructor(
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelPaymentCommand): Promise<Result<string>> {
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
    const alreadyCancelled = walletEvents.some(
      (e) =>
        (e.eventType === 'PaymentCancelled' ||
          e.eventType === 'PaymentRefunded') &&
        e.eventData['paymentId'] === command.paymentId,
    );

    if (alreadyCancelled) {
      return Result.fail(
        `Pago ${command.paymentId} ya fue cancelado o reembolsado`,
      );
    }

    // ─── 3. Reconstruir saldo actual desde eventos ───────────
    const wallet = await this.walletRepository.findById(walletId);
    if (!wallet) {
      return Result.fail(`Wallet ${walletId} no encontrada`);
    }

    const amount = paymentData['amount'] as number;
    const currency = paymentData['currency'] as string;
    const previousBalance = wallet.getBalance();
    const newBalance = previousBalance + amount;

    // ─── 4. Crear evento de cancelación ──────────────────────
    const event = new PaymentCancelledEvent(
      command.paymentId,
      walletId,
      amount,
      currency,
      command.reason,
      previousBalance,
      newBalance,
    );

    // ─── 5. APPEND al Event Store ────────────────────────────
    await this.eventStore.append(walletId, 'Wallet', 'PaymentCancelled', {
      paymentId: event.paymentId,
      walletId: event.walletId,
      amount: event.amount,
      currency: event.currency,
      reason: event.reason,
      previousBalance: event.previousBalance,
      newBalance: event.newBalance,
    });

    this.logger.log(
      `Evento guardado: PaymentCancelled | payment=${command.paymentId} | wallet=${walletId}`,
    );

    // ─── 6. Publicar evento ──────────────────────────────────
    this.eventBus.publish(event);

    return Result.ok(command.paymentId);
  }
}
