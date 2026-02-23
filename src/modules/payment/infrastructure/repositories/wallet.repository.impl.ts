import { Injectable, Logger } from '@nestjs/common';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletRepository } from '../../application/ports/wallet-repository.interface';

/**
 * WalletRepositoryImpl
 *
 * Implementación simulada con datos en memoria para la demo.
 * En producción, esto consultaría la Read DB o el Event Store
 * y reconstruiría el estado de la wallet desde los eventos.
 */
@Injectable()
export class WalletRepositoryImpl implements WalletRepository {
  private readonly logger = new Logger(WalletRepositoryImpl.name);

  /** Wallets de ejemplo para la demo */
  private readonly wallets = new Map<string, Wallet>();

  constructor() {
    this.seedDemoData();
  }

  async findById(walletId: string): Promise<Wallet | null> {
    const wallet = this.wallets.get(walletId);

    if (!wallet) {
      this.logger.warn(`Wallet no encontrada: ${walletId}`);
      return null;
    }

    return wallet;
  }

  private seedDemoData(): void {
    const demoWallets = [
      {
        walletId: 'WAL-001',
        ownerId: 'USER-001',
        balance: 10_000,
        currency: 'USD',
      },
      {
        walletId: 'WAL-002',
        ownerId: 'USER-002',
        balance: 5_000,
        currency: 'USD',
      },
      {
        walletId: 'WAL-003',
        ownerId: 'USER-003',
        balance: 250,
        currency: 'USD',
      },
    ];

    for (const props of demoWallets) {
      const result = Wallet.create(props);
      if (result.success && result.value) {
        this.wallets.set(props.walletId, result.value);
      }
    }

    this.logger.log(`Demo data loaded: ${this.wallets.size} wallets`);
  }
}
