import { Disbursement } from '../../domain/entities/disbursement.entity';

export interface DisbursementRepository {
  save(disbursement: Disbursement): Promise<string>;
  findById(id: string): Promise<Disbursement | null>;
}