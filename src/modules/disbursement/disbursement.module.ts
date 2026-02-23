import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DisbursementController } from './presentation/controllers/disbursement.controller';
import { CreateDisbursementUseCase } from './application/use-cases/create-disbursement.use-case';
import { CreateDisbursementHandler } from './application/commands/create-disbursement.handler';
import { GetDisbursementSummaryHandler } from './application/queries/get-disbursement-summary.handler';
import { DisbursementRepositoryImpl } from './infrastructure/repositories/disbursement.repository.impl';
import { ComplianceServiceImpl } from './infrastructure/services/compliance.service.impl';

const CommandHandlers = [CreateDisbursementHandler];
const QueryHandlers = [GetDisbursementSummaryHandler];

@Module({
  imports: [CqrsModule],
  controllers: [DisbursementController],
  providers: [
    // Use Cases
    CreateDisbursementUseCase,
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
    // Repository
    {
      provide: 'DisbursementRepository',
      useClass: DisbursementRepositoryImpl,
    },
    // Services
    {
      provide: 'ComplianceService',
      useClass: ComplianceServiceImpl,
    },
  ],
})
export class DisbursementModule {}