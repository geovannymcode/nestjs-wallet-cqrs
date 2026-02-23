import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { ProcessPaymentCommand } from '../../application/commands/process-payment.command';
import { GetPaymentHistoryQuery } from '../../application/queries/get-payment-history.query';
import { CancelPaymentDto } from '../dto/cancel-payment.dto';
import { ListPaymentsDto } from '../dto/list-payments.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { GetPaymentByIdQuery } from '../../application/queries/get-payment-by-id.query';
import { ListPaymentsQuery } from '../../application/queries/list-payments.query';
import { CancelPaymentCommand } from '../../application/commands/cancel-payment.command';
import { RefundPaymentCommand } from '../../application/commands/refund-payment.command';

/**
 * PaymentController
 *
 * Controlador delgado: solo maneja HTTP.
 * Toda la lógica de negocio vive en los handlers CQRS.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ COMMANDS (Write Side)                                   │
 * │  POST   /payments              → Procesar pago          │
 * │  POST   /payments/:id/cancel   → Cancelar pago          │
 * │  POST   /payments/:id/refund   → Reembolsar pago        │
 * │                                                         │
 * │ QUERIES (Read Side)                                     │
 * │  GET    /payments              → Listar pagos (filtros)  │
 * │  GET    /payments/:id          → Obtener pago por ID     │
 * │  GET    /payments/history/:id  → Historial de eventos    │
 * │                                                         │
 * │ INFRA                                                   │
 * │  GET    /payments/health       → Health check            │
 * └─────────────────────────────────────────────────────────┘
 */
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // COMMANDS (Write Side)
  // ═══════════════════════════════════════════════════════════

  /** Procesar un pago (Command Side) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processPayment(@Body() dto: ProcessPaymentDto) {
    const command = new ProcessPaymentCommand(
      dto.walletId,
      dto.amount,
      dto.currency,
      dto.recipientWalletId,
      dto.concept,
    );

    const result = await this.commandBus.execute(command);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      paymentId: result.value,
      status: 'PROCESSED',
      message: 'Pago procesado exitosamente',
    };
  }

  /** Cancelar un pago existente (Command Side) */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelPayment(
    @Param('id') paymentId: string,
    @Body() dto: CancelPaymentDto,
  ) {
    const command = new CancelPaymentCommand(paymentId, dto.reason);

    const result = await this.commandBus.execute(command);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      paymentId,
      status: 'CANCELLED',
      reason: dto.reason,
      message: 'Pago cancelado exitosamente',
    };
  }

  /** Reembolsar un pago existente (Command Side) */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    const command = new RefundPaymentCommand(paymentId, dto.reason);

    const result = await this.commandBus.execute(command);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      paymentId,
      status: 'REFUNDED',
      reason: dto.reason,
      message: 'Pago reembolsado exitosamente',
    };
  }

  // ═══════════════════════════════════════════════════════════
  // QUERIES (Read Side)
  // ═══════════════════════════════════════════════════════════

  /** Consultar historial de eventos de una wallet (Query Side) */
  @Get('history/:walletId')
  async getHistory(
    @Param('walletId') walletId: string,
    @Query('limit') limit?: string,
  ) {
    const query = new GetPaymentHistoryQuery(
      walletId,
      limit ? parseInt(limit) : 10,
    );

    const history = await this.queryBus.execute(query);

    return {
      walletId,
      events: history,
      totalEvents: history.length,
      generatedAt: new Date(),
    };
  }

  /** Obtener un pago por ID (Query Side - Read Model) */
  @Get(':id')
  async getPaymentById(@Param('id') paymentId: string) {
    const query = new GetPaymentByIdQuery(paymentId);

    const payment = await this.queryBus.execute(query);

    if (!payment) {
      throw new NotFoundException(`Pago ${paymentId} no encontrado`);
    }

    return payment;
  }

  /** Health check */
  @Get('health')
  health() {
    return {
      status: 'OK',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
    };
  }

  /** Listar pagos con filtros y paginación (Query Side) */
  @Get()
  async listPayments(@Query() dto: ListPaymentsDto) {
    const query = new ListPaymentsQuery(
      dto.walletId,
      dto.status,
      dto.page,
      dto.limit,
    );

    return this.queryBus.execute(query);
  }
}
