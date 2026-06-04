import { IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity!: number;
}
