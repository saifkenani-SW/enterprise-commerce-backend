import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './module/user/user.module';
import { ProductModule } from './module/product/product.module';
import { InventoryModule } from './module/inventory/inventory.module';
import { OrderModule } from './module/order/order.module';
import { PaymentModule } from './module/payment/payment.module';
import { User } from './module/user/entities/user.entity';
import { Product } from './module/product/entities/product.entity';
import { Inventory } from './module/inventory/entities/inventory.entity';
import { Order } from './module/order/entities/order.entity';
import { OrderItem } from './module/order-item/entities/order-item.entity';
import { Payment } from './module/payment/entities/payment.entity';
import { CacheModule } from '@infra/cache';
import { LockModule } from '@infra/lock';
import { BullMqModule } from './libs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5433),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>(
          'DB_DATABASE',
          'parallel_programming',
        ),
        entities: [User, Product, Inventory, Order, OrderItem, Payment],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // خطير في الإنتاج!
        logging: configService.get<string>('NODE_ENV') === 'development',
        // إعدادات إضافية مفيدة
        autoLoadEntities: true, // تحميل الـ entities تلقائياً
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    CacheModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        host: configService.getOrThrow('REDIS_HOST'),

        port: configService.get<number>('REDIS_PORT', 6379),

        password: configService.get('REDIS_PASSWORD'),

        db: configService.get<number>('REDIS_DB', 0),
      }),
    }),
    LockModule,
    BullMqModule.forRootAsync(),
    UserModule,
    ProductModule,
    InventoryModule,
    OrderModule,
    PaymentModule,
  ],
})
export class AppModule {}
