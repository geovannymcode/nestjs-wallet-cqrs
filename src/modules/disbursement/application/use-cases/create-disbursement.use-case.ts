import { Result } from '../../../../shared/domain/result';
import { Disbursement } from '../../domain/entities/disbursement.entity';
import { DisbursementRepository } from '../ports/disbursement-repository.interface';
import { ComplianceService } from '../ports/compliance-service.interface';
import { Injectable, Inject } from '@nestjs/common';

export interface CreateDisbursementInput {
  loanId: string;
  amount: number;
  currency: string;
  recipientAccount: string;
  concept: string;
}

@Injectable()
export class CreateDisbursementUseCase {
  constructor(
    @Inject('DisbursementRepository')
    private readonly disbursementRepository: DisbursementRepository,
    @Inject('ComplianceService')
    private readonly complianceService: ComplianceService,
  ) {}

  async execute(input: CreateDisbursementInput): Promise<Result<string>> {
    // 1. Crear entidad (con validaciones de dominio)
    const disbursementResult = Disbursement.create(input);
    
    if (!disbursementResult.success) {
      return Result.fail(disbursementResult.error!);
    }

    const disbursement = disbursementResult.value!;

    // 2. Verificar compliance
    const complianceCheck = await this.complianceService.checkAccount(
      input.recipientAccount
    );

    if (!complianceCheck.isClean) {
      return Result.fail(`Compliance: ${complianceCheck.reason}`);
    }

    // 3. Guardar
    try {
      const id = await this.disbursementRepository.save(disbursement);
      return Result.ok(id);
    } catch (error) {
      return Result.fail('Error al guardar el desembolso');
    }
  }
}