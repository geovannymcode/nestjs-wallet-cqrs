import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetPaymentByIdQuery } from './get-payment-by-id.query';
import {
  PAYMENT_READ_REPOSITORY,
  PaymentReadRepository,
} from '../ports/payment-read-repository.interface';

/**
 * GetPaymentByIdHandler
 *
 * Consulta el Read Model para obtener un pago por su ID.
 * Lee directamente de la proyección (payments_read_model),
 * NO del Event Store.
 */
@QueryHandler(GetPaymentByIdQuery)
export class GetPaymentByIdHandler implements IQueryHandler<GetPaymentByIdQuery> {
  private readonly logger = new Logger(GetPaymentByIdHandler.name);

  constructor(
    @Inject(PAYMENT_READ_REPOSITORY)
    private readonly paymentReadRepository: PaymentReadRepository,
  ) {}

  async execute(query: GetPaymentByIdQuery) {
    this.logger.log(`Consultando pago: ${query.paymentId}`);

    const payment = await this.paymentReadRepository.findById(query.paymentId);

    return payment ?? null;
  }
}
