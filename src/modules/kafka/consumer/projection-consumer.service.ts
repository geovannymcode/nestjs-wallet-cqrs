import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConsumerService } from './consumer.service';
import { KAFKA_TOPICS } from '../kafka.topics';
import {
  PAYMENT_READ_REPOSITORY,
  PaymentReadRepository,
} from '../../payment/application/ports/payment-read-repository.interface';
import { PaymentStatus } from '../../payment/domain/enums/payment-status.enum';
import { Pool } from 'pg';

/**
 * ProjectionConsumerService
 *
 * Escucha eventos de Kafka y actualiza la base de datos
 * de LECTURA (Read Model). Este es el lado "Query" del CQRS
 * conectado vía Kafka como Event Source.
 *
 * Equivalente al projection-service del artículo del blog,
 * pero integrado en el mismo proceso para simplicidad.
 *
 * Flujo:
 *   Kafka Topic → Consumer → Actualizar Read DB (Proyección)
 *
 * Topics suscritos:
 *   - payment_processed  → Insertar pago + actualizar saldo
 *   - payment_cancelled  → Marcar pago como CANCELLED
 *   - payment_refunded   → Marcar pago como REFUNDED
 */
@Injectable()
export class ProjectionConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ProjectionConsumerService.name);
  private readonly pool: Pool;

  constructor(
    private readonly consumerService: ConsumerService,
    @Inject(PAYMENT_READ_REPOSITORY)
    private readonly paymentReadRepository: PaymentReadRepository,
  ) {
    this.pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME ?? 'fintech',
      user: process.env.DB_USER ?? 'fintech',
      password: process.env.DB_PASSWORD ?? 'fintech',
    });
  }

  async onModuleInit() {
    await this.consumerService.consume(
      {
        topics: [
          KAFKA_TOPICS.PAYMENT_PROCESSED,
          KAFKA_TOPICS.PAYMENT_CANCELLED,
          KAFKA_TOPICS.PAYMENT_REFUNDED,
        ],
      },
      {
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          const data = JSON.parse(message.value.toString());

          this.logger.log(
            `Evento recibido desde Kafka → topic=${topic} | partition=${partition} | key=${message.key}`,
          );

          switch (topic) {
            case KAFKA_TOPICS.PAYMENT_PROCESSED:
              await this.handlePaymentProcessed(data);
              break;
            case KAFKA_TOPICS.PAYMENT_CANCELLED:
              await this.handlePaymentCancelled(data);
              break;
            case KAFKA_TOPICS.PAYMENT_REFUNDED:
              await this.handlePaymentRefunded(data);
              break;
            default:
              this.logger.warn(`Topic no reconocido: ${topic}`);
          }
        },
      },
    );

    this.logger.log(
      'Projection Consumer suscrito a topics de Kafka — esperando eventos...',
    );
  }

  private async handlePaymentProcessed(data: Record<string, unknown>): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insertar pago en el Read Model
      await this.paymentReadRepository.upsert({
        paymentId: data.paymentId as string,
        walletId: data.walletId as string,
        amount: data.amount as number,
        currency: data.currency as string,
        recipientWalletId: data.recipientWalletId as string,
        concept: data.concept as string,
        status: PaymentStatus.PROCESSED,
        createdAt: new Date(data.occurredAt as string),
      });

      // 2. Actualizar saldo en la proyección de wallet
      await client.query(
        `UPDATE wallets_read_model
         SET balance = $1, updated_at = NOW()
         WHERE wallet_id = $2`,
        [data.newBalance, data.walletId],
      );

      await client.query('COMMIT');

      this.logger.log(
        `Proyección Kafka actualizada: PaymentProcessed | wallet=${data.walletId} | ` +
          `balance=${data.previousBalance} → ${data.newBalance}`,
      );
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Error proyectando PaymentProcessed: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  private async handlePaymentCancelled(data: Record<string, unknown>): Promise<void> {
    await this.paymentReadRepository.updateStatus(
      data.paymentId as string,
      PaymentStatus.CANCELLED,
    );

    this.logger.log(
      `Proyección Kafka actualizada: PaymentCancelled | payment=${data.paymentId} | status=CANCELLED`,
    );
  }

  private async handlePaymentRefunded(data: Record<string, unknown>): Promise<void> {
    await this.paymentReadRepository.updateStatus(
      data.paymentId as string,
      PaymentStatus.REFUNDED,
    );

    this.logger.log(
      `Proyección Kafka actualizada: PaymentRefunded | payment=${data.paymentId} | status=REFUNDED`,
    );
  }
}
