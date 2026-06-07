import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../module/user/entities/user.entity';
import { Product } from '../module/product/entities/product.entity';
import { Inventory } from '../module/inventory/entities/inventory.entity';
import { ProductStatus } from '../common/enums/product-status.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';

// ============================================
// 🎯 CUSTOM IDs FOR K6 TESTING
// ============================================
const IDS = {
  users: {
    admin: '10000000-0000-4000-8000-000000000001',
    user1: '10000000-0000-4000-8000-000000000002',
    user2: '10000000-0000-4000-8000-000000000003',
    user3: '10000000-0000-4000-8000-000000000004',
    user4: '10000000-0000-4000-8000-000000000005',
    user5: '10000000-0000-4000-8000-000000000006',
    user6: '10000000-0000-4000-8000-000000000007',
    user7: '10000000-0000-4000-8000-000000000008',
    user8: '10000000-0000-4000-8000-000000000009',
    user9: '10000000-0000-4000-8000-000000000010',
  },
  products: {
    macbook: '20000000-0000-4000-8000-000000000001',
    iphone: '20000000-0000-4000-8000-000000000002',
    sony: '20000000-0000-4000-8000-000000000003',
    samsung: '20000000-0000-4000-8000-000000000004',
    nike: '20000000-0000-4000-8000-000000000005',
    ps5: '20000000-0000-4000-8000-000000000006',
    ipad: '20000000-0000-4000-8000-000000000007',
    dell: '20000000-0000-4000-8000-000000000008',
    bose: '20000000-0000-4000-8000-000000000009',
    canon: '20000000-0000-4000-8000-000000000010',
    nespresso: '20000000-0000-4000-8000-000000000011',
    dyson: '20000000-0000-4000-8000-000000000012',
    lg: '20000000-0000-4000-8000-000000000013',
    jbl: '20000000-0000-4000-8000-000000000014',
    logitech: '20000000-0000-4000-8000-000000000015',
    razer: '20000000-0000-4000-8000-000000000016',
    yeti: '20000000-0000-4000-8000-000000000017',
    samsungWatch: '20000000-0000-4000-8000-000000000018',
    gopro: '20000000-0000-4000-8000-000000000019',
    kindle: '20000000-0000-4000-8000-000000000020',
  },
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🗑️  Cleaning ALL existing data...\n');

  await dataSource.query('DELETE FROM "inventories"');
  await dataSource.query('DELETE FROM "order_items"');
  await dataSource.query('DELETE FROM "payments"');
  await dataSource.query('DELETE FROM "orders"');
  await dataSource.query('DELETE FROM "products"');
  await dataSource.query('DELETE FROM "users"');

  console.log('✅ All old data cleaned successfully!\n');
  console.log('🌱 Starting FULL database seed with CUSTOM IDs...\n');

  const hashedPassword = await bcrypt.hash('123', 10);

  // ============================================
  // 1. 👥 USERS (Bulk Insert)
  // ============================================
  console.log('📦 Creating Users...');
  const userData = [
    { id: IDS.users.admin, fullName: 'Admin User', email: 'admin@example.com' },
    { id: IDS.users.user1, fullName: 'John Doe', email: 'user1@example.com' },
    { id: IDS.users.user2, fullName: 'Jane Smith', email: 'user2@example.com' },
    { id: IDS.users.user3, fullName: 'Bob Wilson', email: 'user3@example.com' },
    {
      id: IDS.users.user4,
      fullName: 'Alice Brown',
      email: 'user4@example.com',
    },
    {
      id: IDS.users.user5,
      fullName: 'Charlie Davis',
      email: 'user5@example.com',
    },
    {
      id: IDS.users.user6,
      fullName: 'Diana Evans',
      email: 'user6@example.com',
    },
    {
      id: IDS.users.user7,
      fullName: 'Frank Green',
      email: 'user7@example.com',
    },
    {
      id: IDS.users.user8,
      fullName: 'Grace Harris',
      email: 'user8@example.com',
    },
    {
      id: IDS.users.user9,
      fullName: 'Henry Irwin',
      email: 'user9@example.com',
    },
  ];

  await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values(userData.map((u) => ({ ...u, password: hashedPassword })))
    .execute();
  console.log(`  ✅ ${userData.length} users created\n`);

  // ============================================
  // 2. 📦 PRODUCTS (Bulk Insert)
  // ============================================
  console.log('📦 Creating Products...');
  const productData = [
    {
      id: IDS.products.macbook,
      name: 'MacBook Pro M4',
      description: 'Apple M4 chip, 16GB RAM, 512GB SSD',
      price: 1299.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.iphone,
      name: 'iPhone 16 Pro',
      description: '256GB - Desert Titanium',
      price: 1099.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.sony,
      name: 'Sony WH-1000XM5',
      description: 'Premium noise-cancelling headphones',
      price: 349.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.samsung,
      name: 'Samsung 4K OLED TV',
      description: '65-inch OLED 4K Smart TV',
      price: 1799.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.nike,
      name: 'Nike Air Max 270',
      description: 'Running shoes with Air cushioning',
      price: 150.0,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.ps5,
      name: 'PlayStation 5',
      description: 'Digital Edition',
      price: 449.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.ipad,
      name: 'iPad Air M2',
      description: '11-inch M2 chip, 128GB',
      price: 599.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.dell,
      name: 'Dell XPS 15',
      description: 'Intel i9, 32GB RAM, 1TB SSD',
      price: 1899.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.bose,
      name: 'Bose QuietComfort Earbuds',
      description: 'Wireless noise-cancelling earbuds',
      price: 279.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.canon,
      name: 'Canon EOS R6',
      description: 'Full-frame mirrorless camera, 20MP, 4K',
      price: 2499.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.nespresso,
      name: 'Nespresso Vertuo Plus',
      description: 'Automatic coffee machine',
      price: 199.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.dyson,
      name: 'Dyson V15 Detect',
      description: 'Cordless vacuum cleaner',
      price: 749.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.lg,
      name: 'LG UltraGear Monitor',
      description: '27-inch 4K Gaming Monitor, 144Hz',
      price: 599.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.jbl,
      name: 'JBL PartyBox 310',
      description: 'Portable Bluetooth speaker',
      price: 449.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.logitech,
      name: 'Logitech MX Master 3S',
      description: 'Wireless ergonomic mouse',
      price: 99.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.razer,
      name: 'Razer BlackWidow V4',
      description: 'Mechanical gaming keyboard',
      price: 169.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.yeti,
      name: 'Yeti Blue Microphone',
      description: 'Professional USB condenser microphone',
      price: 129.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.samsungWatch,
      name: 'Samsung Galaxy Watch 6',
      description: 'Smartwatch 44mm',
      price: 299.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.gopro,
      name: 'GoPro Hero 12',
      description: 'Waterproof action camera, 5.3K',
      price: 399.99,
      status: ProductStatus.ACTIVE,
    },
    {
      id: IDS.products.kindle,
      name: 'Kindle Paperwhite',
      description: '6.8-inch e-reader',
      price: 139.99,
      status: ProductStatus.ACTIVE,
    },
  ];

  await dataSource
    .createQueryBuilder()
    .insert()
    .into(Product)
    .values(productData)
    .execute();
  console.log(`  ✅ ${productData.length} products created\n`);

  // ============================================
  // 3. 📊 INVENTORY (Bulk Insert)
  // ============================================
  console.log('📦 Creating Inventory...');
  const inventoryData = productData.map((p) => ({
    productId: p.id,
    quantity: 10000, // 10,000 لكل منتج
    version: 0,
  }));

  await dataSource
    .createQueryBuilder()
    .insert()
    .into(Inventory)
    .values(inventoryData)
    .execute();
  console.log(`  ✅ ${inventoryData.length} inventory items (10,000 each)\n`);

  // ============================================
  // 💾 SAVE IDs TO FILE FOR K6
  // ============================================
  const k6Config = {
    USERS: Object.values(IDS.users),
    PRODUCTS: Object.values(IDS.products).map((id, i) => ({
      id,
      name: productData[i].name,
      price: productData[i].price,
    })),
  };

  fs.writeFileSync('k6-test-ids.json', JSON.stringify(k6Config, null, 2));
  console.log('💾 IDs saved to k6-test-ids.json\n');

  // ============================================
  // 📊 SUMMARY
  // ============================================
  console.log('='.repeat(60));
  console.log('🎉 FULL SEED COMPLETED!');
  console.log('='.repeat(60));
  console.log(`  👥 Users:    ${userData.length}`);
  console.log(`  📦 Products: ${productData.length}`);
  console.log(`  📊 Inventory: 10,000 units each`);
  console.log(`  🔑 Password: 123`);
  console.log(`\n📋 IDs saved to: k6-test-ids.json`);
  console.log(`\n📧 Test Accounts:`);
  console.log(`  admin@example.com / 123`);
  console.log(`  user1@example.com - user9@example.com / 123`);
  console.log('='.repeat(60));

  await app.close();
}

bootstrap().catch(async (error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
