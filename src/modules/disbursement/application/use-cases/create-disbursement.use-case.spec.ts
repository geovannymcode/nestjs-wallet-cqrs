import { Test, TestingModule } from '@nestjs/testing';
import { CreateDisbursementUseCase } from './create-disbursement.use-case';
import { DisbursementRepository } from '../ports/disbursement-repository.interface';
import { ComplianceService } from '../ports/compliance-service.interface';

describe('CreateDisbursementUseCase', () => {
  let useCase: CreateDisbursementUseCase;
  let disbursementRepo: jest.Mocked<DisbursementRepository>;
  let complianceService: jest.Mocked<ComplianceService>;

  beforeEach(async () => {
    // Create mocks
    const mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    const mockCompliance = {
      checkAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDisbursementUseCase,
        {
          provide: 'DisbursementRepository',
          useValue: mockRepo,
        },
        {
          provide: 'ComplianceService',
          useValue: mockCompliance,
        },
      ],
    }).compile();

    useCase = module.get<CreateDisbursementUseCase>(CreateDisbursementUseCase);
    disbursementRepo = module.get('DisbursementRepository');
    complianceService = module.get('ComplianceService');
  });

  it('should create disbursement when all validations pass', async () => {
    // Arrange
    const input = {
      loanId: 'LOAN-123',
      amount: 1000,
      currency: 'USD',
      recipientAccount: '12345678901234567890',
      concept: 'Test disbursement'
    };

    complianceService.checkAccount.mockResolvedValue({
      isClean: true
    });

    disbursementRepo.save.mockResolvedValue('generated-id');

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.value).toBe('generated-id');
    expect(complianceService.checkAccount).toHaveBeenCalledWith(input.recipientAccount);
    expect(disbursementRepo.save).toHaveBeenCalled();
  });

  it('should fail when compliance check fails', async () => {
    // Arrange
    const input = {
      loanId: 'LOAN-123',
      amount: 1000,
      currency: 'USD',
      recipientAccount: '00000000000000000000',
      concept: 'Test disbursement'
    };

    complianceService.checkAccount.mockResolvedValue({
      isClean: false,
      reason: 'Cuenta en lista negra'
    });

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Compliance: Cuenta en lista negra');
    expect(disbursementRepo.save).not.toHaveBeenCalled();
  });

  it('should fail when domain validation fails', async () => {
    // Arrange
    const input = {
      loanId: 'LOAN-123',
      amount: 50, // Below minimum
      currency: 'USD',
      recipientAccount: '12345678901234567890',
      concept: 'Test disbursement'
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('El monto mínimo es 100');
    expect(complianceService.checkAccount).not.toHaveBeenCalled();
    expect(disbursementRepo.save).not.toHaveBeenCalled();
  });
});