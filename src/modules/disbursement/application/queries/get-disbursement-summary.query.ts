export class GetDisbursementSummaryQuery {
  constructor(
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}