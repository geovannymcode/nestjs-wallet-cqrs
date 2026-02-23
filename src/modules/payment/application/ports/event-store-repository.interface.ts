/**
 * DomainEvent base - todos los eventos del sistema extienden esto.
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
}

/**
 * StoredEvent - Representación de un evento persistido en el Event Store.
 */
export interface StoredEvent {
  readonly id: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly eventType: string;
  readonly eventData: Record<string, unknown>;
  readonly occurredAt: Date;
  readonly version: number;
}

/**
 * Puerto del Event Store.
 *
 * Contrato que define cómo se persisten los eventos.
 * Solo INSERT (append). Nunca UPDATE. Nunca DELETE.
 */
export interface EventStoreRepository {
  /** Agrega un evento al store (append-only) */
  append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: Record<string, unknown>,
  ): Promise<void>;

  /** Recupera todos los eventos de un agregado */
  getEvents(aggregateId: string): Promise<StoredEvent[]>;

  /** Busca un evento por paymentId */
  findEventByPaymentId(paymentId: string): Promise<StoredEvent | null>;
}

export const EVENT_STORE_REPOSITORY = Symbol('EventStoreRepository');
