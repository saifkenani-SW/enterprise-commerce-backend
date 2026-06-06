import { DynamicModule, Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import {
  CACHE_OPTIONS,
  CACHE_TOKEN,
  REDIS_TOKEN,
} from './constants/cache.tokens';
import { CacheModuleOptions } from './config/cache-module-options.interface';
import { RedisCacheService } from './providers/redis/redis-cache.service';
import { CacheModuleAsyncOptions } from './config/cache-module-async-options.interface';

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,

      providers: [
        {
          provide: REDIS_TOKEN,
          useFactory: () => {
            return new Redis({
              host: options.host,
              port: options.port,
              password: options.password,
              db: options.db,
            });
          },
        },

        {
          provide: CACHE_TOKEN,
          useClass: RedisCacheService,
        },
      ],

      exports: [CACHE_TOKEN, REDIS_TOKEN],
    };
  }
  static forRootAsync(options: CacheModuleAsyncOptions): DynamicModule {
    return {
      module: CacheModule,

      imports: options.imports,

      providers: [
        {
          provide: REDIS_TOKEN,

          useFactory: async (config: CacheModuleOptions) => {
            return new Redis({
              host: config.host,
              port: config.port,
              password: config.password,
              db: config.db,
            });
          },

          inject: [CACHE_OPTIONS],
        },

        {
          provide: CACHE_OPTIONS,
          useFactory: options.useFactory!,
          inject: options.inject ?? [],
        },

        {
          provide: CACHE_TOKEN,
          useClass: RedisCacheService,
        },
      ],

      exports: [CACHE_TOKEN, REDIS_TOKEN],
    };
  }
}
