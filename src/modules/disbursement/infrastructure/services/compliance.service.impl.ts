import { Injectable } from '@nestjs/common';
import { 
  ComplianceService, 
  ComplianceCheckResult 
} from '../../application/ports/compliance-service.interface';

@Injectable()
export class ComplianceServiceImpl implements ComplianceService {
  private readonly blacklistedAccounts = [
    '00000000000000000000',
    '99999999999999999999'
  ];

  async checkAccount(account: string): Promise<ComplianceCheckResult> {
    // Simulación simple de compliance
    if (this.blacklistedAccounts.includes(account)) {
      return {
        isClean: false,
        reason: 'Cuenta en lista negra'
      };
    }

    // Simular delay de verificación
    await new Promise(resolve => setTimeout(resolve, 100));

    return { isClean: true };
  }
}