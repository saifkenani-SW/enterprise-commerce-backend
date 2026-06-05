import { IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ProductStatus } from '../../../common/enums/product-status.enum';

export class CreateProductDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  description!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
