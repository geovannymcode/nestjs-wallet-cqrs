/**
 * PaymentCancelledEvent
 *
 * Evento de dominio inmutable que representa la cancelación de un pago.
 * Se guarda en el Event Store y NUNCA se modifica.
 */
export class PaymentCancelledEvent {
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
