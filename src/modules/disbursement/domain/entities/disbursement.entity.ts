import { Result } from '../../../../shared/domain/result';

export interface DisbursementProps {
  loanId: string;
  amount: number;
  currency: string;
  recipientAccount: string;
  concept: string;
}

export class Disbursement {
  private id?: string;
  private loanId: string;
  private amount: number;
  private currency: string;
  private recipientAccount: string;
  private concept: string;
  private status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

  private constructor(props: DisbursementProps) {
    this.loanId = props.loanId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.recipientAccount = props.recipientAccount;
    this.concept = props.concept;
    this.status = 'PENDING';
  }

  // Factory method con validaciones de negocio
  static create(props: DisbursementProps): Result<Disbursement> {
    // Regla 1: Monto mínimo
    if (props.amount < 100) {
      return Result.fail('El monto mínimo es 100');
    }

    // Regla 2: Monto máximo
    if (props.amount > 50000) {
      return Result.fail('El monto máximo es 50,000');
    }

    // Regla 3: Monedas permitidas
    const allowedCurrencies = ['USD', 'PEN'];
    if (!allowedCurrencies.includes(props.currency)) {
      return Result.fail('Moneda no permitida');
    }

    // Regla 4: Formato de cuenta (20 dígitos)
    if (!/^\d{20}$/.test(props.recipientAccount)) {
      return Result.fail('La cuenta debe tener 20 dígitos');
    }

    const disbursement = new Disbursement(props);
    return Result.ok(disbursement);
  }

  // Métodos de negocio
  approve(): Result<void> {
    if (this.status !== 'PENDING') {
      return Result.fail('Solo se pueden aprobar desembolsos pendientes');
    }
    this.status = 'APPROVED';
    return Result.ok();
  }

  reject(reason: string): Result<void> {
    if (this.status !== 'PENDING') {
      return Result.fail('Solo se pueden rechazar desembolsos pendientes');
    }
    if (!reason || reason.trim().length === 0) {
      return Result.fail('Se debe proporcionar una razón');
    }
    this.status = 'REJECTED';
    return Result.ok();
  }

  // Getters
  getId(): string | undefined { return this.id; }
  setId(id: string): void { this.id = id; }
  getStatus(): string { return this.status; }
  getAmount(): number { return this.amount; }
  getCurrency(): string { return this.currency; }
  getLoanId(): string { return this.loanId; }
  getRecipientAccount(): string { return this.recipientAccount; }
  getConcept(): string { return this.concept; }
}