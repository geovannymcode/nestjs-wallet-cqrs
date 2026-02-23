/**
 * PaymentProcessedEvent
 *
 * Evento de dominio inmutable que representa un pago procesado.
 * Este evento se guarda en el Event Store y NUNCA se modifica.
 * Es la fuente de verdad del sistema.
 */
export class PaymentProcessedEvent {
  /** Identificador único del evento */
  public readonly eventId: string;

  /** Momento exacto en que ocurrió el evento */
  public readonly occurredAt: Date;

  constructor(
    public readonly paymentId: string,
    public readonly walletId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly recipientWalletId: string,
    public readonly concept: string,
    public readonly previousBalance: number,
    public readonly newBalance: number,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}
