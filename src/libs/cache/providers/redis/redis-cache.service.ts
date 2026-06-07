import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

import { ICache } from '../../contracts/cache.contract';
import { CacheSetOptions } from '../../contracts/cache-set-options.contract';
import { REDIS_TOKEN } from '../../constants/cache.tokens';

@Injectable()
export class RedisCacheService implements ICache, OnModuleInit {
  constructor(
    @Inject(REDIS_TOKEN)
    private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    const payload = JSON.stringify(value);

    if (options?.ttl) {
      await this.redis.set(key, payload, 'EX', options.ttl);

      return;
    }

    await this.redis.set(key, payload);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }
  async onModuleInit() {
    const pong = await this.redis.ping();

    console.log(`Cache Connected: ${pong}`);
  }
}
