import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../module/user/user.service';
import { ProductService } from '../module/product/product.service';
import { InventoryService } from '../module/inventory/inventory.service';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User } from '../module/user/entities/user.entity';
import { Product } from '../module/product/entities/product.entity';
import { ProductStatus } from '../common/enums/product-status.enum';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const productService = app.get(ProductService);
  const inventoryService = app.get(InventoryService);
  const dataSource = app.get(DataSource);

  console.log('🗑️  Cleaning existing data...\n');

  // حذف البيانات بالترتيب الصحيح (احتراماً للـ foreign keys)
  await dataSource.query('DELETE FROM "inventories"');
  await dataSource.query('DELETE FROM "order_items"');
  await dataSource.query('DELETE FROM "payments"');
  await dataSource.query('DELETE FROM "orders"');
  await dataSource.query('DELETE FROM "products"');
  await dataSource.query('DELETE FROM "users"');

  console.log('✅ Old data cleaned successfully!\n');
  console.log('🌱 Starting database seed...\n');

  // 1. إنشاء المستخدمين
  console.log('Creating users...');
  const users: User[] = [];
  const hashedPassword = await bcrypt.hash('123', 10);

  // مستخدم Admin
  const admin = await userService.create({
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
  });
  users.push(admin);
  console.log(`✅ Admin user created: admin@example.com / 123`);

  // 5 مستخدمين عاديين
  for (let i = 1; i <= 5; i++) {
    const user = await userService.create({
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      password: hashedPassword,
    });
    users.push(user);
    console.log(`✅ User ${i} created: ${user.email} / 123`);
  }

  // 2. إنشاء المنتجات
  console.log('\nCreating products...');
  const products: Product[] = [];

  for (let i = 1; i <= 20; i++) {
    const product = await productService.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      status: faker.helpers.arrayElement([
        ProductStatus.ACTIVE,
        ProductStatus.ACTIVE,
        ProductStatus.ACTIVE,
        ProductStatus.INACTIVE,
        ProductStatus.OUT_OF_STOCK,
      ]),
    });
    products.push(product);
    console.log(`✅ Product ${i}: ${product.name} - $${product.price}`);
  }

  // 3. إنشاء المخزون لكل منتج
  console.log('\nCreating inventory...');
  for (const product of products) {
    const quantity = faker.number.int({ min: 0, max: 500 });
    await inventoryService.create({
      productId: product.id,
      quantity: quantity,
    });
    console.log(`✅ Inventory for "${product.name}": ${quantity} units`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Users: ${users.length} (admin + 5 regular users)`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Inventory items: ${products.length}`);
  console.log(`\n🔑 All user passwords: 123`);
  console.log(`\n💡 Tip: Run 'npm run seed:faker' anytime to reset all data!`);

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
