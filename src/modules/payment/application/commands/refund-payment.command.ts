/**
 * RefundPaymentCommand
 *
 * Representa la INTENCIÓN de reembolsar un pago existente.
 * Objeto inmutable. Solo datos, sin lógica.
 */
export class RefundPaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly reason: string,
  ) {}
}
