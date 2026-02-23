/**
 * PaymentStatus Enum
 *
 * Estados posibles de un pago en el sistema.
 * Usar enum evita magic strings en la lógica de negocio.
 */
export enum PaymentStatus {
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}
