import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Payment } from '../payment/entities/payment.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { randomUUID } from 'crypto';
import type { ILock } from '@infra/lock';
import { LOCK_TOKEN } from '@infra/lock';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import type { ICache } from '@infra/cache';
import { CACHE_TOKEN } from '@infra/cache';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  fromCache: boolean;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private readonly CACHE_TTL = 60;
  private readonly CACHE_PREFIX = 'orders:';

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private dataSource: DataSource,
    @Inject(LOCK_TOKEN)
    private readonly lock: ILock,
    @InjectQueue('email')
    private emailQueue: Queue,
    @Inject(CACHE_TOKEN)
    private readonly cache: ICache,
  ) {}

  // ============================================
  // 🚀 GET ALL - With Caching & Pagination
  // ============================================
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
    userId?: string,
  ): Promise<PaginatedResponse<Order>> {
    // بناء مفتاح الكاش
    const cacheKey = `${this.CACHE_PREFIX}list:${page}:${limit}:${status || 'all'}:${userId || 'all'}`;

    // محاولة جلب من الكاش
    try {
      const cached = await this.cache.get<PaginatedResponse<Order>>(cacheKey);
      if (cached) {
        this.logger.log(`📦 Cache hit: ${cacheKey}`);
        cached.fromCache = true;
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
    }

    // بناء شروط البحث
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [orders, total] = await this.ordersRepository.findAndCount({
      where,
      relations: {
        items: { product: true },
        payment: true,
        user: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const result: PaginatedResponse<Order> = {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
      fromCache: false,
    };

    // تخزين في الكاش
    try {
      await this.cache.set(cacheKey, result, { ttl: this.CACHE_TTL });
      this.logger.log(`📦 Cache set: ${cacheKey}`);
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }

    return result;
  }

  // ============================================
  // 🔍 GET ONE - With Caching
  // ============================================
  async findOne(id: string): Promise<Order & { fromCache: boolean }> {
    const cacheKey = `${this.CACHE_PREFIX}single:${id}`;

    // محاولة جلب من الكاش
    try {
      const cached = await this.cache.get<Order>(cacheKey);
      if (cached) {
        this.logger.log(`📦 Cache hit: ${cacheKey}`);
        return { ...cached, fromCache: true };
      }
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
    }

    // جلب من قاعدة البيانات
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: {
        items: { product: true },
        payment: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    // تخزين في الكاش
    try {
      await this.cache.set(cacheKey, order, { ttl: this.CACHE_TTL });
      this.logger.log(`📦 Cache set: ${cacheKey}`);
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }

    return { ...order, fromCache: false };
  }

  // ============================================
  // ✏️ UPDATE - With Cache Invalidation
  // ============================================
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    const updated = await this.ordersRepository.save(order);

    // حذف الكاش القديم
    await this.invalidateCache(id);

    return updated;
  }

  // ============================================
  // 🗑️ REMOVE - With Cache Invalidation
  // ============================================
  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order as Order);

    // حذف الكاش
    await this.invalidateCache(id);
  }

  // ============================================
  // 🛒 CREATE ORDER
  // ============================================
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const uniqueProductIds = [
      ...new Set(createOrderDto.items.map((item) => item.productId)),
    ].sort();

    const acquiredLocks: { key: string; token: string }[] = [];

    try {
      for (const productId of uniqueProductIds) {
        const key = `inventory:${productId}`;
        const token = await this.lock.acquireWithWait(key, 10_000, {
          timeoutMs: 5_000,
          retryDelayMs: 50,
        });
        acquiredLocks.push({ key, token });
      }

      const order = await this.createOrderInternal(createOrderDto);

      // ✅ إرسال إيميل + إبطال الكاش بعد إنشاء الطلب
     // await this.sendOrderConfirmationEmail(order);
      //await this.invalidateListCache();

      return order;
    } finally {
      for (const acquired of acquiredLocks.reverse()) {
        try {
          await this.lock.release(acquired.key, acquired.token);
        } catch (e) {
          this.logger.error(`Failed to release lock for ${acquired.key}`, e);
        }
      }
    }
  }

  // ============================================
  // 🔄 CACHE INVALIDATION
  // ============================================
  private async invalidateCache(orderId: string): Promise<void> {
    try {
      // حذف كاش الطلب الفردي
      await this.cache.delete(`${this.CACHE_PREFIX}single:${orderId}`);
      // حذف كل كاش القوائم
      await this.invalidateListCache();
      this.logger.log(`🗑️ Cache invalidated for order ${orderId}`);
    } catch (error) {
      this.logger.warn(`Cache invalidation failed: ${error.message}`);
    }
  }

  private async invalidateListCache(): Promise<void> {
    try {
      // حذف جميع مفاتيح القوائم (باستخدام pattern)
      // ملاحظة: Redis لا يدعم حذف بالـ pattern مباشرة، نحتاج keys
      // لكن هذا ثقيل، الأفضل نستخدم TTL قصير بدل الحذف
      const keys = await this.cache.get<string[]>('cache:keys:orders:list');
      if (keys) {
        for (const key of keys) {
          await this.cache.delete(key);
        }
        await this.cache.delete('cache:keys:orders:list');
      }
    } catch (error) {
      this.logger.warn(`List cache invalidation failed: ${error.message}`);
    }
  }

  // ============================================
  // 📊 إحصائيات الطلبات (Cached)
  // ============================================
  async getStats(): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}stats`;

    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    const total = await this.ordersRepository.count();
    const totalAmount = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .getRawOne();

    const byStatus = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const stats = {
      totalOrders: total,
      totalAmount: Number(totalAmount?.total || 0),
      byStatus,
      fromCache: false,
    };

    await this.cache.set(cacheKey, stats, { ttl: 120 }); // دقيقتين

    return stats;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================
  private async createOrderInternal(
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          const productIds = createOrderDto.items.map((item) => item.productId);

          const [products, inventories] = await Promise.all([
            manager.find(Product, { where: { id: In(productIds) } }),
            manager.find(Inventory, { where: { productId: In(productIds) } }),
          ]);

          const productMap = new Map(products.map((p) => [p.id, p]));
          const inventoryMap = new Map(
            inventories.map((inv) => [inv.productId, inv]),
          );

          let totalAmount = 0;
          const orderItems: OrderItem[] = [];

          for (const itemDto of createOrderDto.items) {
            const product = productMap.get(itemDto.productId);
            if (!product)
              throw new NotFoundException(
                `Product ${itemDto.productId} not found`,
              );

            const inventory = inventoryMap.get(itemDto.productId);
            if (!inventory)
              throw new NotFoundException(
                `Inventory for product ${product.id} not found`,
              );

            if (inventory.quantity < itemDto.quantity) {
              throw new BadRequestException(
                `Not enough stock for product ${product.name}`,
              );
            }

            inventory.quantity -= itemDto.quantity;

            const subtotal = Number(product.price) * itemDto.quantity;
            totalAmount += subtotal;

            orderItems.push(
              manager.create(OrderItem, {
                productId: product.id,
                quantity: itemDto.quantity,
                unitPrice: product.price,
                subtotal,
              }),
            );
          }

          await manager.save(Inventory, inventories);

          const order = manager.create(Order, {
            userId: createOrderDto.userId,
            totalAmount,
            status: OrderStatus.PAID,
          });

          const savedOrder = await manager.save(Order, order);

          orderItems.forEach((item) => {
            item.orderId = savedOrder.id;
          });

          await manager.save(OrderItem, orderItems);

          const payment = manager.create(Payment, {
            orderId: savedOrder.id,
            amount: totalAmount,
            status: PaymentStatus.SUCCESS,
            transactionReference: randomUUID(),
          });

          await manager.save(Payment, payment);

          return savedOrder;
        });
      } catch (error) {
        if (
          (error instanceof ConflictException ||
            error.name === 'OptimisticLockVersionMismatchError') &&
          attempt < maxRetries
        ) {
          const delay = Math.pow(2, attempt) * 100 + Math.random() * 50;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException('Failed to create order after retries');
  }

  private async sendOrderConfirmationEmail(order: Order): Promise<void> {
    try {
      const orderWithUser = await this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .where('order.id = :id', { id: order.id })
        .getOne();

      const email='saifkhaledkenani@gmail.com';
      const name='saifkhaledkenani';

/*      if (!orderWithUser?.user?.email) {
        this.logger.warn(`No email for order ${order.id}`);
        return;
      }*/

      const emailDto = {
        to: email,
        subject: `✅ تم تأكيد طلبك #${order.id.slice(0, 8)}`,
        body: `
مرحباً ${name}!

تم إنشاء طلبك بنجاح وهو قيد المعالجة.

📋 تفاصيل الطلب:
• رقم الطلب: ${order.id}
• المبلغ الإجمالي: ${Number(order.totalAmount).toFixed(2)} ريال

شكراً لتسوقك معنا! 🛒
        `.trim(),
      };

      await this.emailQueue.add('send-email', emailDto, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      });

      this.logger.log(`📧 Email queued for ${emailDto.to}`);
    } catch (error) {
      this.logger.error(`Failed to queue email: ${error.message}`);
    }
  }
}
