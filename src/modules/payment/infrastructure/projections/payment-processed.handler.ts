import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PaymentProcessedEvent } from '../../domain/events/payment-processed.event';

/**
 * PaymentProcessedHandler (Projection)
 *
 * Escucha el evento PaymentProcessed y actualiza la base
 * de datos de LECTURA de forma ASÍNCRONA.
 *
 * Este es el lado "eventual" de la consistencia eventual:
 * - El Command ya respondió al usuario
 * - Este handler corre en background
 * - Si falla, el evento sigue en el Event Store → replay
 *
 * ¿Por qué esto es seguro?
 * Porque la fuente de verdad es el Event Store.
 * Esta tabla es solo una PROYECCIÓN optimizada para queries.
 */
@EventsHandler(PaymentProcessedEvent)
export class PaymentProcessedHandler
  implements IEventHandler<PaymentProcessedEvent>
{
  private readonly logger = new Logger(PaymentProcessedHandler.name);
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME ?? 'fintech',
      user: process.env.DB_USER ?? 'fintech',
      password: process.env.DB_PASSWORD ?? 'fintech',
    });
  }

  /**
   * handle() - Actualiza la proyección del Read Model.
   *
   * Inserta el pago en la tabla de lectura Y actualiza
   * el saldo de la wallet. Todo en una transacción.
   */
  async handle(event: PaymentProcessedEvent): Promise<void> {
    this.logger.log(
      `Proyectando evento: PaymentProcessed | payment=${event.paymentId}`,
    );

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // ─── 1. Insertar pago en la tabla de lectura ─────────
      await client.query(
        `INSERT INTO payments_read_model (
          payment_id, wallet_id, amount, currency,
          recipient_wallet_id, concept, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', $7)`,
        [
          event.paymentId,
          event.walletId,
          event.amount,
          event.currency,
          event.recipientWalletId,
          event.concept,
          event.occurredAt,
        ],
      );

      // ─── 2. Actualizar saldo en la proyección de wallet ──
      await client.query(
        `UPDATE wallets_read_model
         SET balance = $1, updated_at = NOW()
         WHERE wallet_id = $2`,
        [event.newBalance, event.walletId],
      );

      await client.query('COMMIT');

      this.logger.log(
        `Proyección actualizada: wallet=${event.walletId} | ` +
        `balance=${event.previousBalance} → ${event.newBalance}`,
      );
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(
        `Error proyectando evento ${event.paymentId}: ${error}`,
      );
      // El evento sigue en el Event Store → se puede re-procesar
      throw error;
    } finally {
      client.release();
    }
  }
}
