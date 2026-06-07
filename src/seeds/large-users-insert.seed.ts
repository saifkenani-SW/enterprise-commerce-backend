import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting ULTRA-FAST user seed - 500,000 users...\n');

  const TOTAL_USERS = 500_000;
  const BATCH_SIZE = 10_000;
  const TOTAL_BATCHES = TOTAL_USERS / BATCH_SIZE;

  const hashedPassword = await bcrypt.hash('123', 10);
  const startTime = Date.now();

  console.log(`📊 Total: ${TOTAL_USERS.toLocaleString()}`);
  console.log(`📦 Batch: ${BATCH_SIZE.toLocaleString()}\n`);

  let totalInserted = 0;

  for (let batch = 1; batch <= TOTAL_BATCHES; batch++) {
    // بناء استعلام INSERT ضخم
    let values = '';
    const startIndex = (batch - 1) * BATCH_SIZE + 1;
    const endIndex = batch * BATCH_SIZE;

    for (let i = startIndex; i <= endIndex; i++) {
      const name = `User ${i}`.replace(/'/g, "''");
      const email = `user${i}@example.com`;
      values += `('${name}', '${email}', '${hashedPassword}'),\n`;
    }

    // إزالة آخر فاصلة وسطر جديد
    values = values.slice(0, -2);

    const query = `
      INSERT INTO "users" ("fullName", "email", "password")
      VALUES ${values}
    `;

    try {
      await dataSource.query(query);
      totalInserted += BATCH_SIZE;

      const elapsed = (Date.now() - startTime) / 1000;
      const progress = ((batch / TOTAL_BATCHES) * 100).toFixed(1);
      const speed = Math.round(totalInserted / elapsed);

      console.log(
        `✅ Batch ${batch}/${TOTAL_BATCHES} | ${totalInserted.toLocaleString()} users | ${progress}% | ${speed}/s`,
      );
    } catch (error) {
      console.error(`❌ Batch ${batch} failed:`, error.message);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 500,000 USERS CREATED!');
  console.log('='.repeat(60));
  console.log(`  ⏱️  Time: ${totalTime}s`);
  console.log(`  🔑 Password: 123`);
  console.log('='.repeat(60));

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
