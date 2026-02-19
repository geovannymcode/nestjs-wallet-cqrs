import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * CancelPaymentDto
 *
 * DTO de entrada para cancelar un pago.
 * class-validator se encarga de la validación de formato.
 */
export class CancelPaymentDto {
  @IsNotEmpty({ message: 'La razón de cancelación es obligatoria' })
  @IsString()
  @MinLength(5, { message: 'La razón debe tener al menos 5 caracteres' })
  readonly reason: string;
}
