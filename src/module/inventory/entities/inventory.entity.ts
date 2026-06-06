import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @VersionColumn()
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => Product, (product) => product.inventory)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;
}
