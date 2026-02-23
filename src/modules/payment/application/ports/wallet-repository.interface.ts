import { Wallet } from '../../domain/entities/wallet.entity';

/**
 * Puerto de salida para acceder a los datos de wallet.
 * La infraestructura provee la implementación concreta.
 */
export interface WalletRepository {
  findById(walletId: string): Promise<Wallet | null>;
}

export const WALLET_REPOSITORY = Symbol('WalletRepository');
