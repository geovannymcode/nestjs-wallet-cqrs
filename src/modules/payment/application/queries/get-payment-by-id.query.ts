/**
 * GetPaymentByIdQuery
 *
 * Query para obtener un pago específico por su ID.
 * Se ejecuta contra el Read Model (proyección).
 */
export class GetPaymentByIdQuery {
  constructor(public readonly paymentId: string) {}
}
