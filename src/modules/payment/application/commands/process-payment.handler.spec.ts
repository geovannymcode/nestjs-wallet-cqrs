import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ProcessPaymentHandler } from './process-payment.handler';
import { ProcessPaymentCommand } from './process-payment.command';
import { WalletRepository, WALLET_REPOSITORY } from '../ports/wallet-repository.interface';
import { EventStoreRepository, EVENT_STORE_REPOSITORY } from '../ports/event-store-repository.interface';
import { Wallet } from '../../domain/entities/wallet.entity';

describe('ProcessPaymentHandler', () => {
  let handler: ProcessPaymentHandler;
  let walletRepo: jest.Mocked<WalletRepository>;
  let eventStore: jest.Mocked<EventStoreRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessPaymentHandler,
        {
          provide: WALLET_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: EVENT_STORE_REPOSITORY,
          useValue: { append: jest.fn(), getEvents: jest.fn() },
        },
        {
          provide: EventBus,
          useValue: { publish: jest.fn() },
        },
      ],
    }).compile();

    handler = module.get(ProcessPaymentHandler);
    walletRepo = module.get(WALLET_REPOSITORY);
    eventStore = module.get(EVENT_STORE_REPOSITORY);
    eventBus = module.get(EventBus);
  });

  it('should process payment and append event to store', async () => {
    // Arrange
    const wallet = Wallet.create({
      walletId: 'WAL-001', ownerId: 'USER-001',
      balance: 10_000, currency: 'USD',
    }).value!;

    walletRepo.findById.mockResolvedValue(wallet);
    eventStore.append.mockResolvedValue();

    const command = new ProcessPaymentCommand(
      'WAL-001', 500, 'USD', 'WAL-002', 'Test payment',
    );

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.value).toBeDefined();
    expect(eventStore.append).toHaveBeenCalledWith(
      'WAL-001', 'Wallet', 'PaymentProcessed',
      expect.objectContaining({ amount: 500, newBalance: 9_500 }),
    );
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should reject payment when wallet not found', async () => {
    walletRepo.findById.mockResolvedValue(null);

    const command = new ProcessPaymentCommand(
      'WAL-FAKE', 500, 'USD', 'WAL-002', 'Test',
    );

    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('no encontrada');
    expect(eventStore.append).not.toHaveBeenCalled();
  });

  it('should reject payment with insufficient funds', async () => {
    const wallet = Wallet.create({
      walletId: 'WAL-003', ownerId: 'USER-003',
      balance: 250, currency: 'USD',
    }).value!;

    walletRepo.findById.mockResolvedValue(wallet);

    const command = new ProcessPaymentCommand(
      'WAL-003', 5_000, 'USD', 'WAL-001', 'Too much',
    );

    const result = await handler.execute(command);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Fondos insuficientes');
    expect(eventStore.append).not.toHaveBeenCalled();
  });
});
