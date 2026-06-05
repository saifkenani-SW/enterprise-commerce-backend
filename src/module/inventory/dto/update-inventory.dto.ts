import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity!: number;
}
