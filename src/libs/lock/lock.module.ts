import { Global, Module } from '@nestjs/common';

import { CacheModule } from '@infra/cache';

import { LOCK_TOKEN } from './constants/lock.tokens';

import { RedisLockService } from './services/redis-lock.service';

@Global()
@Module({
  imports: [CacheModule],

  providers: [
    {
      provide: LOCK_TOKEN,
      useClass: RedisLockService,
    },
  ],

  exports: [LOCK_TOKEN],
})
export class LockModule {}
