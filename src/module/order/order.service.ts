import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Payment } from '../payment/entities/payment.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    private dataSource: DataSource,
  ) {}

  

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOneBy({ id });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    Object.assign(order, updateOrderDto);

    return this.ordersRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    await this.ordersRepository.remove(order);
  }




  /**
   * ACID Transaction 
   * START TRANSACTION

        Create Order
        Create Order Items
        Decrease Inventory
        Create Payment
        COMMIT

   * @param createOrderDto 
   * @returns 
   */

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    return this.dataSource.transaction(async (manager) => {
      let totalAmount = 0;
      const orderItemsData: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id ${itemDto.productId} not found`,
          );
        }

        const inventory = await manager.findOne(Inventory, {
          where: {
            productId: product.id,
          },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Inventory for product ${product.id} not found`,
          );
        }

        if (inventory.quantity < itemDto.quantity) {
          throw new BadRequestException(
            `Not enough stock for product ${product.name}`,
          );
        }

        inventory.quantity -= itemDto.quantity;
        await manager.save(Inventory, inventory);

        const subtotal = Number(product.price) * itemDto.quantity;
        totalAmount += subtotal;

        const orderItem = manager.create(OrderItem, {
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice: product.price,
          subtotal,
        });

        orderItemsData.push(orderItem);
      }

      const order = manager.create(Order, {
        userId: createOrderDto.userId,
        totalAmount,
        status: OrderStatus.PAID,
      });

      const savedOrder = await manager.save(Order, order);

      for (const item of orderItemsData) {
        item.orderId = savedOrder.id;
      }

      await manager.save(OrderItem, orderItemsData);

      const payment = manager.create(Payment, {
        orderId: savedOrder.id,
        amount: totalAmount,
        status: PaymentStatus.SUCCESS,
        transactionReference: `TXN-${Date.now()}`,
      });

      await manager.save(Payment, payment);

      const result = await manager
        .getRepository(Order)
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('order.payment', 'payment')
        .where('order.id = :id', { id: savedOrder.id })
        .getOne();

      if (!result) {
        throw new NotFoundException(`Order with id ${savedOrder.id} not found`);
      }

      return result;
    });
  }
}