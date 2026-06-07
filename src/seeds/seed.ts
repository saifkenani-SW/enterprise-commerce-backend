import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../module/user/user.service';
import { ProductService } from '../module/product/product.service';
import { InventoryService } from '../module/inventory/inventory.service';
import { OrderService } from '../module/order/order.service';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User } from '../module/user/entities/user.entity';
import { Product } from '../module/product/entities/product.entity';
import { ProductStatus } from '../common/enums/product-status.enum';
import { DataSource } from 'typeorm';

// ============================================
// ثوابت المعرفات (Static UUIDs for k6 Load Testing)
// ============================================
const SEED_USERS = [
  {
    id: '11111111-0000-4000-8000-000000000000',
    email: 'admin@example.com',
    name: 'Admin User',
  },
  {
    id: '11111111-0000-4000-8000-000000000001',
    email: 'user1@example.com',
    name: 'Test User 1',
  },
  {
    id: '11111111-0000-4000-8000-000000000002',
    email: 'user2@example.com',
    name: 'Test User 2',
  },
  {
    id: '11111111-0000-4000-8000-000000000003',
    email: 'user3@example.com',
    name: 'Test User 3',
  },
  {
    id: '11111111-0000-4000-8000-000000000004',
    email: 'user4@example.com',
    name: 'Test User 4',
  },
  {
    id: '11111111-0000-4000-8000-000000000005',
    email: 'user5@example.com',
    name: 'Test User 5',
  },
  {
    id: '11111111-0000-4000-8000-000000000006',
    email: 'user6@example.com',
    name: 'Test User 6',
  },
  {
    id: '11111111-0000-4000-8000-000000000007',
    email: 'user7@example.com',
    name: 'Test User 7',
  },
  {
    id: '11111111-0000-4000-8000-000000000008',
    email: 'user8@example.com',
    name: 'Test User 8',
  },
  {
    id: '11111111-0000-4000-8000-000000000009',
    email: 'user9@example.com',
    name: 'Test User 9',
  },
];

const SEED_PRODUCT_IDS = [
  '22222222-0000-4000-8000-000000000001',
  '22222222-0000-4000-8000-000000000002',
  '22222222-0000-4000-8000-000000000003',
  '22222222-0000-4000-8000-000000000004',
  '22222222-0000-4000-8000-000000000005',
  '22222222-0000-4000-8000-000000000006',
  '22222222-0000-4000-8000-000000000007',
  '22222222-0000-4000-8000-000000000008',
  '22222222-0000-4000-8000-000000000009',
  '22222222-0000-4000-8000-000000000010',
];

async function bootstrap() {
  console.log('\n[TRACE] 1. Initializing Nest Application Context...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const productService = app.get(ProductService);
  const inventoryService = app.get(InventoryService);
  const orderService = app.get(OrderService);
  const dataSource = app.get(DataSource);

  console.log(
    '\n[TRACE] 2. 🗑️ Cleaning ALL existing data (TRUNCATE CASCADE)...',
  );
  try {
    await dataSource.query('TRUNCATE TABLE "users", "products" CASCADE');
  } catch (error: any) {
    console.error('\n[FATAL ERROR IN TRUNCATE]:', error.message);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash('123', 10);
  const allUserIds: string[] = [];

  // ============================================
  // 1. إنشاء المستخدمين
  // ============================================
  console.log('\n[TRACE] 3. 👥 Generating 100,000 Users...');

  for (const seedUser of SEED_USERS) {
    await userService.create({
      id: seedUser.id,
      fullName: seedUser.name,
      email: seedUser.email,
      password: hashedPassword,
    } as any);
    allUserIds.push(seedUser.id);
  }
  console.log(`[TRACE] -> Inserted 10 Static Users successfully.`);

  const userRepository = dataSource.getRepository(User);
  const REMAINING_USERS = 99990;
  const USER_CHUNK_SIZE = 5000;

  for (let i = 0; i < REMAINING_USERS / USER_CHUNK_SIZE; i++) {
    // 🔴 تم إصلاح المصفوفة هنا
    const chunk: any[] = [];
    for (let j = 0; j < USER_CHUNK_SIZE; j++) {
      const id = faker.string.uuid();
      allUserIds.push(id);
      chunk.push({
        id,
        fullName: faker.person.fullName(),
        email: `u_${i}_${j}_${faker.string.alphanumeric(6)}@test.com`,
        password: hashedPassword,
      });
    }
    await userRepository.insert(chunk);
    console.log(
      `[TRACE] -> Inserted ${(i + 1) * USER_CHUNK_SIZE + 10} / 100,000 Users`,
    );
  }

  // ============================================
  // 2. إنشاء المنتجات والمخزون
  // ============================================
  console.log('\n[TRACE] 4. 📦 Creating Products & Massive Inventory...');
  const products: Product[] = [];

  for (let i = 0; i < 10; i++) {
    const product = await productService.create({
      id: SEED_PRODUCT_IDS[i],
      name: `Enterprise Product ${i + 1}`,
      description: 'High-performance test product',
      price: parseFloat(faker.commerce.price({ min: 10, max: 2000 })),
      status: ProductStatus.ACTIVE,
    } as any);
    products.push(product);

    await inventoryService.create({
      productId: product.id,
      quantity: 1000000,
    });
  }

  // ============================================
  // 3. إنشاء 10,000 طلب بنظام التزامن المنضبط
  // ============================================
  console.log('\n[TRACE] 5. 🛒 Creating 10,000 Orders...');
  const TOTAL_ORDERS = 10000;
  const ORDER_CONCURRENCY = 50;
  let successfulOrders = 0;

  for (let i = 0; i < TOTAL_ORDERS; i += ORDER_CONCURRENCY) {
    // 🔴 تم إصلاح المصفوفة هنا
    const orderPromises: Promise<any>[] = [];

    for (let j = 0; j < ORDER_CONCURRENCY && i + j < TOTAL_ORDERS; j++) {
      const randomUserId =
        allUserIds[Math.floor(Math.random() * allUserIds.length)];
      const itemsCount = faker.number.int({ min: 1, max: 4 });

      // 🔴 تم إصلاح المصفوفة هنا
      const items: { productId: string; quantity: number }[] = [];

      const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
      for (let k = 0; k < itemsCount; k++) {
        items.push({
          productId: shuffledProducts[k].id,
          quantity: faker.number.int({ min: 1, max: 3 }),
        });
      }

      orderPromises.push(
        orderService.create({
          userId: randomUserId,
          items: items,
        }),
      );
    }

    const results = await Promise.allSettled(orderPromises);
    successfulOrders += results.filter((r) => r.status === 'fulfilled').length;

    if ((i + ORDER_CONCURRENCY) % 500 === 0) {
      console.log(
        `[TRACE] -> Processed ${(i + ORDER_CONCURRENCY).toLocaleString()} / ${TOTAL_ORDERS.toLocaleString()} Orders...`,
      );
    }
  }

  console.log('\n[TRACE] 6. Closing Application Context...');
  await app.close();

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 MASSIVE SEED COMPLETED!`);
  console.log(`👥 Users Inserted: ${allUserIds.length.toLocaleString()}`);
  console.log(
    `🛒 Successful Orders: ${successfulOrders.toLocaleString()} / ${TOTAL_ORDERS.toLocaleString()}`,
  );
  console.log('='.repeat(60) + '\n');
}

bootstrap().catch(async (error) => {
  console.error('\n❌ [TRACE FATAL] Massive Seed failed:', error);
  process.exit(1);
});
