import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';


import { Product } from '../product/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Payment } from '../payment/entities/payment.entity';
import { QUEUES } from 'src/libs/bullmq/constants/queues';
import { Order } from '../order/entities/order.entity';
import { OrderStatus } from 'src/common/enums/order-status.enum';

@Processor(QUEUES.ORDER, {
  concurrency: 5,
})
export class OrderWorker extends WorkerHost {

  constructor(
    private dataSource: DataSource,

  ) {
    super();
  }

  async process(job: Job) {
    const { orderId, items, userId } = job.data;
console.log('🔥 Worker started');
console.log('📦 Job received:', job.data);
    return this.dataSource.transaction(async (manager) => {

      const productIds = items.map(i => i.productId);

      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });

      const inventories = await manager.find(Inventory, {
        where: { productId: In(productIds) },
      });

      let total = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {

        const product = products.find(p => p.id === item.productId);
        const inventory = inventories.find(i => i.productId === item.productId);

        if (!product || !inventory) {
          throw new Error('Invalid product/inventory');
        }

        if (inventory.quantity < item.quantity) {
          throw new Error('Out of stock');
        }

        inventory.quantity -= item.quantity;

        total += Number(product.price) * item.quantity;

        orderItems.push(
          manager.create(OrderItem, {
            orderId,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: Number(product.price) * item.quantity,
          }),
        );
      }

      await manager.save(Inventory, inventories);
      await manager.save(OrderItem, orderItems);

      await manager.update(Order, orderId, {
        totalAmount: total,
        status: OrderStatus.COMPLETED,
      });

      // optional: enqueue payment
      return { success: true, orderId };
    });
  }
}