import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CartItem } from './cart-item.entity';
import { User } from 'src/module/user/entities/user.entity';

@Entity('cart')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;


  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    eager: true,
  })
  items!: CartItem[];

  @OneToOne(() => User)
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  
}
