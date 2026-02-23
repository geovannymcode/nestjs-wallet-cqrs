import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ProcessPaymentCommand } from './process-payment.command';
import { PaymentProcessedEvent } from '../../domain/events/payment-processed.event';
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
 * ProcessPaymentHandler
 *
 * Recibe el comando, valida reglas de negocio y guarda
 * el evento en el Event Store. NUNCA hace UPDATE directo
 * al saldo. Solo INSERT de un evento inmutable.
 *
 * Flujo:
 *   Command → Validar → Crear Evento → Append al Event Store → Publicar
 */
@CommandHandler(ProcessPaymentCommand)
export class ProcessPaymentHandler
  implements ICommandHandler<ProcessPaymentCommand>
{
  private readonly logger = new Logger(ProcessPaymentHandler.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ProcessPaymentCommand): Promise<Result<string>> {
    // ─── 1. Buscar la wallet del pagador ───────────────────
    const wallet = await this.walletRepository.findById(command.walletId);

    if (!wallet) {
      return Result.fail(`Wallet ${command.walletId} no encontrada`);
    }

    // ─── 2. Validar reglas de negocio (dominio) ────────────
    const validation = wallet.canProcessPayment(command.amount);

    if (!validation.success) {
      this.logger.warn(`Pago rechazado: ${validation.error}`);
      return Result.fail(validation.error!);
    }

    // ─── 3. Calcular nuevo saldo (sin modificar la wallet) ─
    const previousBalance = wallet.getBalance();
    const newBalance = wallet.calculateNewBalance(command.amount);

    // ─── 4. Crear evento de dominio ────────────────────────
    const event = new PaymentProcessedEvent(
      crypto.randomUUID(), // paymentId
      command.walletId,
      command.amount,
      command.currency,
      command.recipientWalletId,
      command.concept,
      previousBalance,
      newBalance,
    );

    // ─── 5. APPEND al Event Store (solo INSERT, NUNCA UPDATE) ─
    await this.eventStore.append(
      command.walletId,       // aggregateId
      'Wallet',              // aggregateType
      'PaymentProcessed',    // eventType
      {
        paymentId: event.paymentId,
        walletId: event.walletId,
        amount: event.amount,
        currency: event.currency,
        recipientWalletId: event.recipientWalletId,
        concept: event.concept,
        previousBalance: event.previousBalance,
        newBalance: event.newBalance,
      },
    );

    this.logger.log(
      `Evento guardado: PaymentProcessed | wallet=${command.walletId} | amount=${command.amount}`,
    );

    // ─── 6. Publicar evento para handlers asíncronos ───────
    this.eventBus.publish(event);

    return Result.ok(event.paymentId);
  }
}
