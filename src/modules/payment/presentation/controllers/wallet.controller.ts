import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ListWalletsQuery } from '../../application/queries/list-wallets.query';

/**
 * WalletController
 *
 * Controlador delgado para consultas de wallets.
 *
 * ┌─────────────────────────────────────────────┐
 * │ QUERIES (Read Side)                          │
 * │  GET    /wallets   → Listar todas las wallets│
 * └─────────────────────────────────────────────┘
 */
@Controller('wallets')
export class WalletController {
  constructor(private readonly queryBus: QueryBus) {}

  /** Listar todas las wallets disponibles */
  @Get()
  async listWallets() {
    return this.queryBus.execute(new ListWalletsQuery());
  }
}
