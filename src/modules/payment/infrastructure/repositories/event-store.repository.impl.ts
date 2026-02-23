import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import {
  EventStoreRepository,
  StoredEvent,
} from '../../application/ports/event-store-repository.interface';

/**
 * EventStoreRepositoryImpl
 *
 * Implementación del Event Store usando PostgreSQL.
 * La tabla es APPEND-ONLY: solo INSERT, nunca UPDATE ni DELETE.
 *
 * Tabla:
 *   event_store (
 *     aggregate_id, aggregate_type, event_type,
 *     event_data (JSONB), occurred_at, version,
 *     UNIQUE(aggregate_id, version)  ← Optimistic concurrency
 *   )
 *
 * El constraint UNIQUE(aggregate_id, version) funciona como
 * optimistic locking: si dos procesos intentan insertar la
 * misma versión, uno falla. Sin SELECT FOR UPDATE, sin locks.
 */
@Injectable()
export class EventStoreRepositoryImpl
  implements EventStoreRepository, OnModuleInit
{
  private readonly logger = new Logger(EventStoreRepositoryImpl.name);
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

  async onModuleInit(): Promise<void> {
    await this.ensureTable();
  }

  /**
   * append() - Inserta un evento inmutable.
   *
   * NUNCA hace UPDATE. NUNCA hace DELETE.
   * La versión se auto-incrementa por agregado.
   */
  async append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<void> {
    // Obtener la siguiente versión para este agregado
    const versionResult = await this.pool.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
       FROM event_store
       WHERE aggregate_id = $1`,
      [aggregateId],
    );

    const nextVersion = parseInt(versionResult.rows[0].next_version);

    // INSERT inmutable — si hay conflicto de versión, falla limpio
    await this.pool.query(
      `INSERT INTO event_store (
        aggregate_id,
        aggregate_type,
        event_type,
        event_data,
        occurred_at,
        version
      ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
      [
        aggregateId,
        aggregateType,
        eventType,
        JSON.stringify(eventData),
        nextVersion,
      ],
    );

    this.logger.log(
      `Event appended: ${eventType} | aggregate=${aggregateId} | v${nextVersion}`,
    );
  }

  /**
   * getEvents() - Recupera TODOS los eventos de un agregado
   * ordenados por versión. Permite reconstruir el estado
   * desde cero (replay).
   */
  async getEvents(aggregateId: string): Promise<StoredEvent[]> {
    const result = await this.pool.query(
      `SELECT id, aggregate_id, aggregate_type,
              event_type, event_data, occurred_at, version
       FROM event_store
       WHERE aggregate_id = $1
       ORDER BY version ASC`,
      [aggregateId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      eventType: row.event_type,
      eventData: row.event_data,
      occurredAt: row.occurred_at,
      version: row.version,
    }));
  }

  /**
   * findEventByPaymentId() - Busca un evento específico por paymentId
   * usando el operador JSONB de PostgreSQL.
   * Útil para cancelaciones y reembolsos que necesitan el evento original.
   */
  async findEventByPaymentId(paymentId: string): Promise<StoredEvent | null> {
    const result = await this.pool.query(
      `SELECT id, aggregate_id, aggregate_type,
              event_type, event_data, occurred_at, version
       FROM event_store
       WHERE event_data->>'paymentId' = $1
         AND event_type = 'PaymentProcessed'
       LIMIT 1`,
      [paymentId],
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      eventType: row.event_type,
      eventData: row.event_data,
      occurredAt: row.occurred_at,
      version: row.version,
    };
  }

  /** Crea la tabla del Event Store si no existe */
  private async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS event_store (
        id              SERIAL PRIMARY KEY,
        aggregate_id    VARCHAR(255) NOT NULL,
        aggregate_type  VARCHAR(100) NOT NULL,
        event_type      VARCHAR(100) NOT NULL,
        event_data      JSONB NOT NULL,
        occurred_at     TIMESTAMP NOT NULL DEFAULT NOW(),
        version         INTEGER NOT NULL,
        UNIQUE(aggregate_id, version)
      )
    `);
    this.logger.log('Event Store table ready');
  }
}
