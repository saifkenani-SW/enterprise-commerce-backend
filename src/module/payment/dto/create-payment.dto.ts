import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsUUID()
  orderId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  transactionReference?: string;
}
