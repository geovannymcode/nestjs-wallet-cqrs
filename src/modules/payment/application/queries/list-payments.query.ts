import { PaymentStatus } from '../../domain/enums/payment-status.enum';

/**
 * ListPaymentsQuery
 *
 * Query para listar pagos con filtros opcionales.
 * Soporta filtrado por walletId, status, y paginación.
 */
export class ListPaymentsQuery {
  constructor(
    public readonly walletId?: string,
    public readonly status?: PaymentStatus,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
