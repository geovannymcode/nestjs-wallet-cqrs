/**
 * CancelPaymentCommand
 *
 * Representa la INTENCIÓN de cancelar un pago existente.
 * Objeto inmutable. Solo datos, sin lógica.
 */
export class CancelPaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly reason: string,
  ) {}
}
