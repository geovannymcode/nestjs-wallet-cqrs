import { 
  Controller, 
  Post, 
  Body, 
  BadRequestException,
  Get,
  Query 
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDisbursementDto } from '../dto/create-disbursement.dto';
import { CreateDisbursementCommand } from '../../application/commands/create-disbursement.command';
import { GetDisbursementSummaryQuery } from '../../application/queries/get-disbursement-summary.query';

@Controller('disbursements')
export class DisbursementController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() dto: CreateDisbursementDto) {
    const command = new CreateDisbursementCommand(
      dto.loanId,
      dto.amount,
      dto.currency,
      dto.recipientAccount,
      dto.concept,
    );

    const result = await this.commandBus.execute(command);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      id: result.value,
      status: 'PENDING',
      message: 'Desembolso creado exitosamente'
    };
  }

  @Get('summary')
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query = new GetDisbursementSummaryQuery(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const summary = await this.queryBus.execute(query);

    return {
      summary,
      generatedAt: new Date(),
    };
  }

  @Get('health')
  health() {
    return { status: 'OK', message: 'Disbursement service is running' };
  }
}