import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let totalAmount = 0;
    const orderItemsData: OrderItem[] = [];

    // Validate products and calculate total
    for (const itemDto of createOrderDto.items) {
      const product = await this.productsRepository.findOneBy({
        id: itemDto.productId,
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${itemDto.productId} not found`,
        );
      }

      const subtotal =
        Number(product.price) * itemDto.quantity;
      totalAmount += subtotal;

      const orderItem = this.orderItemsRepository.create({
        productId: product.id,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        subtotal: subtotal,
      });

      orderItemsData.push(orderItem);
    }

    // Create order
    const order = this.ordersRepository.create({
      userId: createOrderDto.userId,
      totalAmount: totalAmount,
      items: orderItemsData,
    });

    // Save order and items
    const savedOrder = await this.ordersRepository.save(order);

    // Associate items with order
    for (const item of orderItemsData) {
      item.orderId = savedOrder.id;
    }
    await this.orderItemsRepository.save(orderItemsData);

    const result = await this.ordersRepository.findOneBy({ id: savedOrder.id });
    if (!result) {
      throw new NotFoundException(`Order with id ${savedOrder.id} not found`);
    }
    return result;
  }

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
}
