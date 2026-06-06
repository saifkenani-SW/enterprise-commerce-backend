import { IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export class UpdateCartDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
