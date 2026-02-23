import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  IsIn,
} from 'class-validator';

/**
 * ProcessPaymentDto
 *
 * DTO de entrada para procesar un pago.
 * class-validator se encarga de la validación de formato.
 * Las reglas de negocio viven en el dominio (Wallet entity).
 */
export class ProcessPaymentDto {
  @IsNotEmpty()
  @IsString()
  readonly walletId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'El monto mínimo es 0.01' })
  @Max(50_000, { message: 'El monto máximo es 50,000' })
  readonly amount: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['USD', 'COP'], { message: 'Moneda no soportada' })
  readonly currency: string;

  @IsNotEmpty()
  @IsString()
  readonly recipientWalletId: string;

  @IsNotEmpty()
  @IsString()
  readonly concept: string;
}
