import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { RefundPaymentHandler } from './refund-payment.handler';
import { RefundPaymentCommand } from './refund-payment.command';
import {
  WalletRepository,
  WALLET_REPOSITORY,
} from '../ports/wallet-repository.interface';
import {
  EventStoreRepository,
  EVENT_STORE_REPOSITORY,
  StoredEvent,
} from '../ports/event-store-repository.interface';
import { Wallet } from '../../domain/entities/wallet.entity';

describe('RefundPaymentHandler', () => {
  let handler: RefundPaymentHandler;
  let eventStore: jest.Mocked<EventStoreRepository>;
  let walletRepo: jest.Mocked<WalletRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockPaymentEvent: StoredEvent = {
    id: 1,
    aggregateId: 'WAL-001',
    aggregateType: 'Wallet',
    eventType: 'PaymentProcessed',
    eventData: {
      paymentId: 'PAY-001',
      walletId: 'WAL-001',
      amount: 1000,
      currency: 'USD',
      recipientWalletId: 'WAL-002',
      concept: 'Compra',
      previousBalance: 10000,
      newBalance: 9000,
    },
    occurredAt: new Date(),
    version: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundPaymentHandler,
        {
          provide: EVENT_STORE_REPOSITORY,
          useValue: {
            findEventByPaymentId: jest.fn(),
            getEvents: jest.fn(),
            append: jest.fn(),
          },
        },
        {
          provide: WALLET_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: EventBus,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    handler = module.get(RefundPaymentHandler);
    eventStore = module.get(EVENT_STORE_REPOSITORY);
    walletRepo = module.get(WALLET_REPOSITORY);
    eventBus = module.get(EventBus);
  });

  it('should refund payment and append event', async () => {
    const wallet = Wallet.create({
      walletId: 'WAL-001',
      ownerId: 'USER-001',
      balance: 9000,
      currency: 'USD',
    }).value!;

    eventStore.findEventByPaymentId.mockResolvedValue(mockPaymentEvent);
    eventStore.getEvents.mockResolvedValue([mockPaymentEvent]);
    walletRepo.findById.mockResolvedValue(wallet);
    eventStore.append.mockResolvedValue();

    const command = new RefundPaymentCommand('PAY-001', 'Producto defectuoso');
    const result = await handler.execute(command);

    expect(result.success).toBe(true);
    expect(eventStore.append).toHaveBeenCalledWith(
      'WAL-001',
      'Wallet',
      'PaymentRefunded',
      expect.objectContaining({
        paymentId: 'PAY-001',
        amount: 1000,
        newBalance: 10000,
      }),
    );
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should reject refund when payment not found', async () => {
    eventStore.findEventByPaymentId.mockResolvedValue(null);

    const command = new RefundPaymentCommand('PAY-FAKE', 'No existe');
    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('no encontrado');
  });

  it('should reject refund when already refunded', async () => {
    const refundedEvent: StoredEvent = {
      ...mockPaymentEvent,
      id: 2,
      eventType: 'PaymentRefunded',
      eventData: { ...mockPaymentEvent.eventData, paymentId: 'PAY-001' },
      version: 2,
    };

    eventStore.findEventByPaymentId.mockResolvedValue(mockPaymentEvent);
    eventStore.getEvents.mockResolvedValue([mockPaymentEvent, refundedEvent]);

    const command = new RefundPaymentCommand('PAY-001', 'Doble refund');
    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('ya fue cancelado o reembolsado');
  });
});
