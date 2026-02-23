import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CancelPaymentHandler } from './cancel-payment.handler';
import { CancelPaymentCommand } from './cancel-payment.command';
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

describe('CancelPaymentHandler', () => {
  let handler: CancelPaymentHandler;
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
      amount: 500,
      currency: 'USD',
      recipientWalletId: 'WAL-002',
      concept: 'Test',
      previousBalance: 10000,
      newBalance: 9500,
    },
    occurredAt: new Date(),
    version: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelPaymentHandler,
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

    handler = module.get(CancelPaymentHandler);
    eventStore = module.get(EVENT_STORE_REPOSITORY);
    walletRepo = module.get(WALLET_REPOSITORY);
    eventBus = module.get(EventBus);
  });

  it('should cancel payment and append event', async () => {
    const wallet = Wallet.create({
      walletId: 'WAL-001',
      ownerId: 'USER-001',
      balance: 9500,
      currency: 'USD',
    }).value!;

    eventStore.findEventByPaymentId.mockResolvedValue(mockPaymentEvent);
    eventStore.getEvents.mockResolvedValue([mockPaymentEvent]);
    walletRepo.findById.mockResolvedValue(wallet);
    eventStore.append.mockResolvedValue();

    const command = new CancelPaymentCommand('PAY-001', 'Error del usuario');
    const result = await handler.execute(command);

    expect(result.success).toBe(true);
    expect(eventStore.append).toHaveBeenCalledWith(
      'WAL-001',
      'Wallet',
      'PaymentCancelled',
      expect.objectContaining({ paymentId: 'PAY-001', amount: 500 }),
    );
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should reject cancellation when payment not found', async () => {
    eventStore.findEventByPaymentId.mockResolvedValue(null);

    const command = new CancelPaymentCommand('PAY-FAKE', 'No existe');
    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('no encontrado');
    expect(eventStore.append).not.toHaveBeenCalled();
  });

  it('should reject cancellation when already cancelled', async () => {
    const cancelledEvent: StoredEvent = {
      ...mockPaymentEvent,
      id: 2,
      eventType: 'PaymentCancelled',
      eventData: { ...mockPaymentEvent.eventData, paymentId: 'PAY-001' },
      version: 2,
    };

    eventStore.findEventByPaymentId.mockResolvedValue(mockPaymentEvent);
    eventStore.getEvents.mockResolvedValue([mockPaymentEvent, cancelledEvent]);

    const command = new CancelPaymentCommand('PAY-001', 'Doble cancelación');
    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('ya fue cancelado');
    expect(eventStore.append).not.toHaveBeenCalled();
  });
});
