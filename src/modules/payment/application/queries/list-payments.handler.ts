import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ListPaymentsQuery } from './list-payments.query';
import {
  PAYMENT_READ_REPOSITORY,
  PaymentReadModel,
  PaymentReadRepository,
} from '../ports/payment-read-repository.interface';

export interface PaginatedPayments {
  data: PaymentReadModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * ListPaymentsHandler
 *
 * Consulta el Read Model con filtros y paginación.
 * Demuestra el Query side del CQRS: lecturas optimizadas
 * desde una proyección, no desde el Event Store.
 */
@QueryHandler(ListPaymentsQuery)
export class ListPaymentsHandler implements IQueryHandler<ListPaymentsQuery> {
  private readonly logger = new Logger(ListPaymentsHandler.name);

  constructor(
    @Inject(PAYMENT_READ_REPOSITORY)
    private readonly paymentReadRepository: PaymentReadRepository,
  ) {}

  async execute(query: ListPaymentsQuery): Promise<PaginatedPayments> {
    this.logger.log(
      `Listando pagos: wallet=${query.walletId ?? 'ALL'} | status=${query.status ?? 'ALL'} | page=${query.page}`,
    );

    const { data, total } = await this.paymentReadRepository.findAll({
      walletId: query.walletId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
