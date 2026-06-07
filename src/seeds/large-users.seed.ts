import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../module/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting LARGE user seed - 500,000 users...\n');

  const TOTAL_USERS = 500_000;
  const BATCH_SIZE = 5_000; // 5,000 مستخدم في الدفعة
  const TOTAL_BATCHES = TOTAL_USERS / BATCH_SIZE;

  const hashedPassword = await bcrypt.hash('123', 10);
  const startTime = Date.now();

  console.log(`📊 Total: ${TOTAL_USERS.toLocaleString()} users`);
  console.log(`📦 Batch size: ${BATCH_SIZE.toLocaleString()}`);
  console.log(`🔄 Total batches: ${TOTAL_BATCHES}\n`);

  let totalInserted = 0;

  for (let batch = 1; batch <= TOTAL_BATCHES; batch++) {
    const users: Partial<User>[] = [];

    // إنشاء بيانات الدفعة في الذاكرة
    for (let i = 0; i < BATCH_SIZE; i++) {
      const userIndex = (batch - 1) * BATCH_SIZE + i + 1;

      users.push({
        fullName: faker.person.fullName(),
        email: `user${userIndex}@example.com`,
        password: hashedPassword,
      });
    }

    // إدخال الدفعة دفعة واحدة (Bulk Insert)
    try {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(User)
        .values(users)
        .execute();

      totalInserted += BATCH_SIZE;

      // حساب التقدم
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = ((batch / TOTAL_BATCHES) * 100).toFixed(1);
      const speed = Math.round(totalInserted / elapsed);
      const remaining = Math.round((TOTAL_USERS - totalInserted) / speed);

      console.log(
        `✅ Batch ${batch}/${TOTAL_BATCHES} | ` +
          `Inserted: ${totalInserted.toLocaleString()} | ` +
          `Progress: ${progress}% | ` +
          `Speed: ${speed.toLocaleString()}/s | ` +
          `ETA: ${remaining}s`,
      );
    } catch (error) {
      console.error(`❌ Batch ${batch} failed:`, error.message);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETED!');
  console.log('='.repeat(60));
  console.log(`  👥 Users: ${totalInserted.toLocaleString()}`);
  console.log(`  ⏱️  Time: ${totalTime}s`);
  console.log(
    `  🚀 Speed: ${Math.round(totalInserted / Number(totalTime)).toLocaleString()}/s`,
  );
  console.log(`  🔑 Password: 123`);
  console.log('='.repeat(60));

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
