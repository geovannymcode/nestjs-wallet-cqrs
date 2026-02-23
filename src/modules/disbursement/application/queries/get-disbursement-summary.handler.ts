import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Pool } from 'pg';
import { GetDisbursementSummaryQuery } from './get-disbursement-summary.query';

export interface DisbursementSummary {
  totalCount: number;
  totalAmount: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

@QueryHandler(GetDisbursementSummaryQuery)
export class GetDisbursementSummaryHandler implements IQueryHandler<GetDisbursementSummaryQuery> {
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

  async execute(query: GetDisbursementSummaryQuery): Promise<DisbursementSummary> {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected
      FROM disbursements
      WHERE ($1::timestamp IS NULL OR created_at >= $1)
        AND ($2::timestamp IS NULL OR created_at <= $2)
    `, [query.startDate, query.endDate]);

    const row = result.rows[0];

    return {
      totalCount: parseInt(row.total_count),
      totalAmount: parseFloat(row.total_amount),
      byStatus: {
        pending: parseInt(row.pending),
        approved: parseInt(row.approved),
        rejected: parseInt(row.rejected),
      },
    };
  }
}