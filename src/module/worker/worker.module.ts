import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderWorker } from './order.processor';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Product } from '../product/entities/product.entity';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from 'src/libs/bullmq/constants/queues';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Inventory]),
    BullModule.registerQueue({
      name: QUEUES.ORDER,
    }),
  ],

  providers: [OrderWorker],
})
export class WorkerModule {}