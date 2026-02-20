/**
 * PaymentReadModel - Representación de un pago en la base de lectura.
 */
export interface PaymentReadModel {
  readonly paymentId: string;
  readonly walletId: string;
  readonly amount: number;
  readonly currency: string;
  readonly recipientWalletId: string;
  readonly concept: string;
  readonly status: string;
  readonly createdAt: Date;
}

export interface FindAllFilters {
  readonly walletId?: string;
  readonly status?: string;
  readonly page: number;
  readonly limit: number;
}

export interface FindAllResult {
  readonly data: PaymentReadModel[];
  readonly total: number;
}

/**
 * Puerto del Payment Read Repository.
 *
 * Contrato para leer pagos desde la base de lectura (proyección).
 * Este es el Query side del CQRS: lecturas optimizadas.
 */
export interface PaymentReadRepository {
  findById(paymentId: string): Promise<PaymentReadModel | null>;
  findAll(filters: FindAllFilters): Promise<FindAllResult>;
  upsert(payment: PaymentReadModel): Promise<void>;
  updateStatus(paymentId: string, status: string): Promise<void>;
}

export const PAYMENT_READ_REPOSITORY = Symbol('PaymentReadRepository');
