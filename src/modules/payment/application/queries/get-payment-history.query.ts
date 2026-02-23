/**
 * GetPaymentHistoryQuery
 *
 * Query para obtener el historial de pagos de una wallet.
 * Se ejecuta contra la Read DB (proyección), no contra el Event Store.
 */
export class GetPaymentHistoryQuery {
  constructor(
    public readonly walletId: string,
    public readonly limit: number = 10,
  ) {}
}
