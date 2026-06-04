import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomConfigModule } from './common/configuration/config.module';
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

@Module({
  imports: [
    CustomConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [User, Product, Inventory, Order, OrderItem, Payment],
        synchronize: true,
      }),
    }),
    UserModule,
    ProductModule,
    InventoryModule,
    OrderModule,
    PaymentModule,
  ],
})
export class AppModule {}
