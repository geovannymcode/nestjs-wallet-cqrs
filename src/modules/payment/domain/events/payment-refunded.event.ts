/**
 * PaymentRefundedEvent
 *
 * Evento de dominio inmutable que representa un reembolso.
 * El dinero regresa a la wallet del pagador original.
 */
export class PaymentRefundedEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly paymentId: string,
    public readonly walletId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly reason: string,
    public readonly previousBalance: number,
    public readonly newBalance: number,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}
