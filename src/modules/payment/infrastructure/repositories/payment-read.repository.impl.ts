import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import {
  PaymentReadRepository,
  PaymentReadModel,
  FindAllFilters,
  FindAllResult,
} from '../../application/ports/payment-read-repository.interface';

/**
 * PaymentReadRepositoryImpl
 *
 * Implementación del Read Model para pagos.
 * Lee directamente de la tabla payments_read_model,
 * que es actualizada asíncronamente por los Event Handlers (proyecciones).
 *
 * Este es el lado Query del CQRS: optimizado para lecturas.
 */
@Injectable()
export class PaymentReadRepositoryImpl implements PaymentReadRepository {
  private readonly logger = new Logger(PaymentReadRepositoryImpl.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME ?? 'fintech',
      user: process.env.DB_USER ?? 'fintech',
      password: process.env.DB_PASSWORD ?? 'fintech',
    });
  }

  async findById(paymentId: string): Promise<PaymentReadModel | null> {
    const result = await this.pool.query(
      `SELECT payment_id, wallet_id, amount, currency,
              recipient_wallet_id, concept, status, created_at
       FROM payments_read_model
       WHERE payment_id = $1`,
      [paymentId],
    );

    if (result.rows.length === 0) return null;

    return this.mapRow(result.rows[0]);
  }

  async findAll(filters: FindAllFilters): Promise<FindAllResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.walletId) {
      conditions.push(`wallet_id = $${paramIndex++}`);
      params.push(filters.walletId);
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await this.pool.query(
      `SELECT COUNT(*) AS total FROM payments_read_model ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].total);

    // Fetch page
    const offset = (filters.page - 1) * filters.limit;
    const dataResult = await this.pool.query(
      `SELECT payment_id, wallet_id, amount, currency,
              recipient_wallet_id, concept, status, created_at
       FROM payments_read_model
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, filters.limit, offset],
    );

    return {
      data: dataResult.rows.map((row) => this.mapRow(row)),
      total,
    };
  }

  async upsert(payment: PaymentReadModel): Promise<void> {
    await this.pool.query(
      `INSERT INTO payments_read_model (
        payment_id, wallet_id, amount, currency,
        recipient_wallet_id, concept, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (payment_id) DO UPDATE SET status = $7`,
      [
        payment.paymentId,
        payment.walletId,
        payment.amount,
        payment.currency,
        payment.recipientWalletId,
        payment.concept,
        payment.status,
        payment.createdAt,
      ],
    );
  }

  async updateStatus(paymentId: string, status: string): Promise<void> {
    await this.pool.query(
      `UPDATE payments_read_model SET status = $1 WHERE payment_id = $2`,
      [status, paymentId],
    );

    this.logger.log(
      `Read model actualizado: payment=${paymentId} → status=${status}`,
    );
  }

  private mapRow(row: Record<string, unknown>): PaymentReadModel {
    return {
      paymentId: row.payment_id as string,
      walletId: row.wallet_id as string,
      amount: parseFloat(row.amount as string),
      currency: row.currency as string,
      recipientWalletId: row.recipient_wallet_id as string,
      concept: row.concept as string,
      status: row.status as string,
      createdAt: row.created_at as Date,
    };
  }
}
