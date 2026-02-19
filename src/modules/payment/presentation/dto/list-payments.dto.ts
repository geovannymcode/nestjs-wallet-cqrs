import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';

/**
 * ListPaymentsDto
 *
 * DTO para los query params del listado de pagos.
 * Soporta filtrado por walletId, status, y paginación.
 */
export class ListPaymentsDto {
  @IsOptional()
  @IsString()
  readonly walletId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Status inválido. Valores: PROCESSED, CANCELLED, REFUNDED' })
  readonly status?: PaymentStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  readonly page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  readonly limit: number = 20;
}
