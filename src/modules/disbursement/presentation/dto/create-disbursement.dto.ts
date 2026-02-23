import { IsNotEmpty, IsNumber, IsString, Min, IsIn, Matches } from 'class-validator';

export class CreateDisbursementDto {
  @IsNotEmpty()
  @IsString()
  loanId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['USD', 'COL'])
  currency: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{20}$/, { message: 'La cuenta debe tener 20 dígitos' })
  recipientAccount: string;

  @IsNotEmpty()
  @IsString()
  concept: string;
}