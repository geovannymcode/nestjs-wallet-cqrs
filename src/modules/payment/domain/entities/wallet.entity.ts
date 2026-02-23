import { Result } from '../../../../shared/domain/result';

export interface WalletProps {
  walletId: string;
  ownerId: string;
  balance: number;
  currency: string;
}

/**
 * Wallet Entity
 *
 * Entidad de dominio que encapsula las reglas de negocio
 * de una billetera digital. Todas las validaciones viven aquí.
 */
export class Wallet {
  private readonly walletId: string;
  private readonly ownerId: string;
  private balance: number;
  private readonly currency: string;

  private constructor(props: WalletProps) {
    this.walletId = props.walletId;
    this.ownerId = props.ownerId;
    this.balance = props.balance;
    this.currency = props.currency;
  }

  static create(props: WalletProps): Result<Wallet> {
    if (props.balance < 0) {
      return Result.fail('El saldo inicial no puede ser negativo');
    }
    return Result.ok(new Wallet(props));
  }

  /** Valida si el pago es posible (sin modificar estado) */
  canProcessPayment(amount: number): Result<void> {
    if (amount <= 0) {
      return Result.fail('El monto debe ser mayor a cero');
    }
    if (amount > 50_000) {
      return Result.fail('El monto máximo por transacción es 50,000');
    }
    if (this.balance < amount) {
      return Result.fail(
        `Fondos insuficientes. Disponible: ${this.balance}, Requerido: ${amount}`,
      );
    }
    return Result.ok();
  }

  /** Retorna el saldo que resultaría después del pago */
  calculateNewBalance(amount: number): number {
    return this.balance - amount;
  }

  getWalletId(): string {
    return this.walletId;
  }
  getBalance(): number {
    return this.balance;
  }
  getCurrency(): string {
    return this.currency;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
}
