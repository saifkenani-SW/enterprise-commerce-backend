import { IsNotEmpty, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  quantity!: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
