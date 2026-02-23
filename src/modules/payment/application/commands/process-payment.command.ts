/**
 * ProcessPaymentCommand
 *
 * Representa la INTENCIÓN de procesar un pago.
 * Es un objeto inmutable. Solo contiene datos, sin lógica.
 */
export class ProcessPaymentCommand {
  constructor(
    public readonly walletId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly recipientWalletId: string,
    public readonly concept: string,
  ) {}
}
