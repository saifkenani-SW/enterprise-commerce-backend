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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const productService = app.get(ProductService);
  const inventoryService = app.get(InventoryService);
  const orderService = app.get(OrderService);
  const dataSource = app.get(DataSource);

  console.log('🗑️  Cleaning ALL existing data...\n');

  // حذف البيانات بالترتيب الصحيح (احتراماً للـ foreign keys)
  await dataSource.query('DELETE FROM "inventories"');
  await dataSource.query('DELETE FROM "order_items"');
  await dataSource.query('DELETE FROM "payments"');
  await dataSource.query('DELETE FROM "orders"');
  await dataSource.query('DELETE FROM "products"');
  await dataSource.query('DELETE FROM "users"');

  console.log('✅ All old data cleaned successfully!\n');
  console.log('🌱 Starting FULL database seed...\n');

  // ============================================
  // 1. إنشاء المستخدمين
  // ============================================
  console.log('📦 Creating Users...');
  const users: User[] = [];
  const hashedPassword = await bcrypt.hash('123', 10);

  // Admin
  const admin = await userService.create({
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
  });
  users.push(admin);
  console.log(`  ✅ Admin: admin@example.com`);

  // 9 مستخدمين عاديين
  for (let i = 1; i <= 9; i++) {
    const user = await userService.create({
      fullName: faker.person.fullName(),
      email: `user${i}@example.com`,
      password: hashedPassword,
    });
    users.push(user);
    console.log(`  ✅ User ${i}: user${i}@example.com`);
  }

  // ============================================
  // 2. إنشاء المنتجات
  // ============================================
  console.log('\n📦 Creating Products...');
  const products: Product[] = [];

  const productData = [
    {
      name: 'MacBook Pro M4',
      description: 'Latest Apple MacBook Pro with M4 chip, 16GB RAM, 512GB SSD',
      price: 1299.99,
    },
    {
      name: 'iPhone 16 Pro',
      description: 'Apple iPhone 16 Pro 256GB - Desert Titanium',
      price: 1099.99,
    },
    {
      name: 'Sony WH-1000XM5',
      description: 'Premium noise-cancelling wireless headphones',
      price: 349.99,
    },
    {
      name: 'Samsung 4K OLED TV',
      description: '65-inch OLED 4K Smart TV with HDR',
      price: 1799.99,
    },
    {
      name: 'Nike Air Max 270',
      description: "Men's running shoes with Air cushioning",
      price: 150.0,
    },
    {
      name: 'PlayStation 5',
      description: 'Sony PlayStation 5 Digital Edition',
      price: 449.99,
    },
    {
      name: 'iPad Air M2',
      description: 'Apple iPad Air 11-inch M2 chip, 128GB',
      price: 599.99,
    },
    {
      name: 'Dell XPS 15',
      description: 'Dell XPS 15 Laptop - Intel i9, 32GB RAM, 1TB SSD',
      price: 1899.99,
    },
    {
      name: 'Bose QuietComfort Earbuds',
      description: 'Wireless noise-cancelling earbuds',
      price: 279.99,
    },
    {
      name: 'Canon EOS R6',
      description: 'Full-frame mirrorless camera, 20MP, 4K video',
      price: 2499.99,
    },
    {
      name: 'Nespresso Vertuo Plus',
      description: 'Automatic coffee machine with milk frother',
      price: 199.99,
    },
    {
      name: 'Dyson V15 Detect',
      description: 'Cordless vacuum cleaner with laser dust detection',
      price: 749.99,
    },
    {
      name: 'LG UltraGear Monitor',
      description: '27-inch 4K Gaming Monitor, 144Hz, 1ms',
      price: 599.99,
    },
    {
      name: 'JBL PartyBox 310',
      description: 'Portable Bluetooth party speaker with lights',
      price: 449.99,
    },
    {
      name: 'Logitech MX Master 3S',
      description: 'Wireless ergonomic mouse for productivity',
      price: 99.99,
    },
    {
      name: 'Razer BlackWidow V4',
      description: 'Mechanical gaming keyboard with RGB',
      price: 169.99,
    },
    {
      name: 'Yeti Blue Microphone',
      description: 'Professional USB condenser microphone',
      price: 129.99,
    },
    {
      name: 'Samsung Galaxy Watch 6',
      description: 'Smartwatch with health tracking, 44mm',
      price: 299.99,
    },
    {
      name: 'GoPro Hero 12',
      description: 'Waterproof action camera, 5.3K video, stabilized',
      price: 399.99,
    },
    {
      name: 'Kindle Paperwhite',
      description: '6.8-inch e-reader with adjustable warm light',
      price: 139.99,
    },
  ];

  for (let i = 0; i < productData.length; i++) {
    const data = productData[i];
    const product = await productService.create({
      name: data.name,
      description: data.description,
      price: data.price,
      status:
        i < 18
          ? ProductStatus.ACTIVE
          : i < 19
            ? ProductStatus.INACTIVE
            : ProductStatus.OUT_OF_STOCK,
    });
    products.push(product);
    console.log(`  ✅ ${product.name} - $${product.price}`);
  }

  // ============================================
  // 3. إنشاء المخزون (كميات كبيرة للاختبار)
  // ============================================
  console.log('\n📦 Creating Inventory (Large quantities for testing)...');
  const inventoryQuantities = [
    5000, // MacBook - مخزون كبير جداً
    3000, // iPhone
    2000, // Sony Headphones
    1500, // Samsung TV
    5000, // Nike Shoes
    2500, // PS5
    3000, // iPad
    1000, // Dell XPS
    4000, // Bose Earbuds
    500, // Canon Camera
    3000, // Nespresso
    2000, // Dyson
    1500, // LG Monitor
    2500, // JBL Speaker
    5000, // Logitech Mouse
    3000, // Razer Keyboard
    4000, // Yeti Microphone
    2000, // Samsung Watch
    1500, // GoPro
    3000, // Kindle
  ];

  for (let i = 0; i < products.length; i++) {
    const quantity = inventoryQuantities[i];
    await inventoryService.create({
      productId: products[i].id,
      quantity: quantity,
    });
    console.log(`  ✅ ${products[i].name}: ${quantity.toLocaleString()} units`);
  }

  // ============================================
  // 4. إنشاء طلبات سابقة (للاختبار)
  // ============================================
  console.log('\n📦 Creating Sample Orders...');

  const orderStatuses = ['PENDING', 'PAID', 'COMPLETED', 'CANCELLED'] as const;

  for (let i = 0; i < 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const numItems = faker.number.int({ min: 1, max: 3 });
    const items: { productId: string; quantity: number }[] = [];

    // اختيار منتجات عشوائية للطلب
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numItems; j++) {
      items.push({
        productId: shuffledProducts[j].id,
        quantity: faker.number.int({ min: 1, max: 5 }),
      });
    }

    try {
      const order = await orderService.create({
        userId: randomUser.id,
        items: items,
      });
      console.log(
        `  ✅ Order #${i + 1}: ${order.items?.length || 0} items - $${Number(order.totalAmount).toFixed(2)}`,
      );
    } catch (error) {
      console.log(`  ⚠️ Order #${i + 1} failed: ${error.message}`);
    }
  }

  // ============================================
  // 5. ملخص
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 FULL SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log(`\n📊 Final Summary:`);
  console.log(`  👥 Users:        ${users.length} (admin + 9 regular)`);
  console.log(`  📦 Products:     ${products.length}`);
  console.log(
    `  📊 Inventory:    ${products.length} items (1,500 - 5,000 units each)`,
  );
  console.log(`  🛒 Orders:       10 sample orders created`);
  console.log(`\n🔑 All Passwords: 123`);
  console.log(`📧 Admin Login:    admin@example.com / 123`);
  console.log(`📧 User Login:     user1@example.com - user9@example.com / 123`);
  console.log(`\n💡 Perfect for load testing and development!\n`);

  await app.close();
}

bootstrap().catch(async (error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
