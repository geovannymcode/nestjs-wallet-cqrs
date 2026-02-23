import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateDisbursementCommand } from './create-disbursement.command';
import { CreateDisbursementUseCase } from '../use-cases/create-disbursement.use-case';
import { Result } from '../../../../shared/domain/result';

@CommandHandler(CreateDisbursementCommand)
export class CreateDisbursementHandler implements ICommandHandler<CreateDisbursementCommand> {
  constructor(
    private readonly createDisbursementUseCase: CreateDisbursementUseCase,
  ) {}

  async execute(command: CreateDisbursementCommand): Promise<Result<string>> {
    return this.createDisbursementUseCase.execute({
      loanId: command.loanId,
      amount: command.amount,
      currency: command.currency,
      recipientAccount: command.recipientAccount,
      concept: command.concept,
    });
  }
}