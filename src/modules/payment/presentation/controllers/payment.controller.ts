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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ProcessPaymentDto } from '../dto/process-payment.dto';
import { ProcessPaymentCommand } from '../../application/commands/process-payment.command';
import { GetPaymentHistoryQuery } from '../../application/queries/get-payment-history.query';

/**
 * PaymentController
 *
 * Controlador delgado: solo maneja HTTP.
 * Toda la lógica de negocio vive en los handlers.
 */
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  /** Health check */
  @Get('health')
  health() {
    return { status: 'OK', service: 'payment-service' };
  }
}
