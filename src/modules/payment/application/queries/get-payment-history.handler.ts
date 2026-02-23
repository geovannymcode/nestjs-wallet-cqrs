import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetPaymentHistoryQuery } from './get-payment-history.query';
import {
  EVENT_STORE_REPOSITORY,
  EventStoreRepository,
  StoredEvent,
} from '../ports/event-store-repository.interface';

export interface PaymentHistoryItem {
  eventType: string;
  amount: number;
  currency: string;
  recipientWalletId: string;
  concept: string;
  previousBalance: number;
  newBalance: number;
  occurredAt: Date;
  version: number;
}

/**
 * GetPaymentHistoryHandler
 *
 * Recupera el historial de eventos desde el Event Store.
 * Demuestra que con Event Sourcing puedes reconstruir
 * todo el historial de una wallet en cualquier momento.
 */
@QueryHandler(GetPaymentHistoryQuery)
export class GetPaymentHistoryHandler implements IQueryHandler<GetPaymentHistoryQuery> {
  private readonly logger = new Logger(GetPaymentHistoryHandler.name);

  constructor(
    @Inject(EVENT_STORE_REPOSITORY)
    private readonly eventStore: EventStoreRepository,
  ) {}

  async execute(query: GetPaymentHistoryQuery): Promise<PaymentHistoryItem[]> {
    const events = await this.eventStore.getEvents(query.walletId);

    this.logger.log(
      `Historial consultado: wallet=${query.walletId} | ${events.length} eventos`,
    );

    return events.slice(-query.limit).map((event: StoredEvent) => ({
      eventType: event.eventType,
      amount: event.eventData['amount'] as number,
      currency: event.eventData['currency'] as string,
      recipientWalletId: event.eventData['recipientWalletId'] as string,
      concept: event.eventData['concept'] as string,
      previousBalance: event.eventData['previousBalance'] as number,
      newBalance: event.eventData['newBalance'] as number,
      occurredAt: event.occurredAt,
      version: event.version,
    }));
  }
}
