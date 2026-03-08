import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ListWalletsQuery } from './list-wallets.query';
import {
  WALLET_REPOSITORY,
  WalletRepository,
} from '../ports/wallet-repository.interface';

export interface WalletSummary {
  walletId: string;
  ownerName: string;
  currency: string;
}

/**
 * ListWalletsHandler
 *
 * Devuelve todas las wallets disponibles con el formato
 * esperado por el frontend (walletId, ownerName, currency).
 */
@QueryHandler(ListWalletsQuery)
export class ListWalletsHandler implements IQueryHandler<ListWalletsQuery> {
  private readonly logger = new Logger(ListWalletsHandler.name);

  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(): Promise<WalletSummary[]> {
    const wallets = await this.walletRepository.findAll();

    this.logger.log(`Listando wallets: ${wallets.length} encontradas`);

    return wallets.map((wallet) => ({
      walletId: wallet.getWalletId(),
      ownerName: wallet.getOwnerName(),
      currency: wallet.getCurrency(),
    }));
  }
}
