import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * RefundPaymentDto
 *
 * DTO de entrada para solicitar reembolso de un pago.
 * class-validator se encarga de la validación de formato.
 */
export class RefundPaymentDto {
  @IsNotEmpty({ message: 'La razón del reembolso es obligatoria' })
  @IsString()
  @MinLength(5, { message: 'La razón debe tener al menos 5 caracteres' })
  readonly reason: string;
}
