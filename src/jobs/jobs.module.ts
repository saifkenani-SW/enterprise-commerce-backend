import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../module/order/entities/order.entity';
import { CacheModule } from '@infra/cache';
import { LockModule } from '@infra/lock';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Order]),
    CacheModule,
    LockModule,
  ],
  providers: [],
  exports: [],
})
export class JobsModule {}
