import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Disbursement } from '../../domain/entities/disbursement.entity';
import { DisbursementRepository } from '../../application/ports/disbursement-repository.interface';

@Injectable()
export class DisbursementRepositoryImpl implements DisbursementRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fintech',
      user: process.env.DB_USER || 'fintech',
      password: process.env.DB_PASSWORD || 'fintech',
    });
  }

  async save(disbursement: Disbursement): Promise<string> {
    const query = `
      INSERT INTO disbursements (loan_id, amount, currency, recipient_account, concept, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [
      disbursement.getLoanId(),
      disbursement.getAmount(),
      disbursement.getCurrency(),
      disbursement.getRecipientAccount(),
      disbursement.getConcept(),
      disbursement.getStatus(),
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error saving disbursement:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<Disbursement | null> {
    // Implementación simple para la demo
    return null;
  }
}