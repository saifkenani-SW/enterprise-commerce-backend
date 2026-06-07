import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppThrottlerGuard } from './guards/app-throttler.guard';
import { RedisRateLimitService } from './services/redis-rate-limit.service';

@Global()
@Module({
  providers: [
    RedisRateLimitService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
  exports: [RedisRateLimitService],
})
export class RateLimitModule {}
