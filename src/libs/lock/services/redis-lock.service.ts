import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import Redis from 'ioredis';
import { randomUUID } from 'crypto';

import { REDIS_TOKEN } from '@infra/cache';

import { ILock } from '../contracts/lock.contract';
import { LockWaitOptions } from '../contracts/lock-wait-options.contract';

import { RELEASE_LOCK_SCRIPT } from '../lua/release-lock.lua';

import { LockAlreadyAcquiredException } from '../exceptions/lock-already-acquired.exception';

@Injectable()
export class RedisLockService implements ILock, OnModuleInit {
  constructor(
    @Inject(REDIS_TOKEN)
    private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    const pong = await this.redis.ping();

    console.log(`Lock Connected: ${pong}`);
  }

  async acquire(key: string, ttlMs: number): Promise<string | null> {
    if (ttlMs <= 0) {
      throw new Error('ttlMs must be greater than 0');
    }

    const token = randomUUID();

    const lockKey = this.buildLockKey(key);

    const result = await this.redis.set(lockKey, token, 'PX', ttlMs, 'NX');

    return result === 'OK' ? token : null;
  }

  async acquireWithWait(
    key: string,
    ttlMs: number,
    options: LockWaitOptions,
  ): Promise<string> {
    if (ttlMs <= 0) {
      throw new Error('ttlMs must be greater than 0');
    }

    if (options.timeoutMs <= 0) {
      throw new Error('timeoutMs must be greater than 0');
    }

    const retryDelayMs = options.retryDelayMs ?? 100;

    const startedAt = Date.now();

    while (Date.now() - startedAt < options.timeoutMs) {
      const token = await this.acquire(key, ttlMs);

      if (token) {
        return token;
      }

      await this.sleep(retryDelayMs);
    }

    throw new Error(`Lock timeout for key: ${key}`);
  }

  async release(key: string, token: string): Promise<boolean> {
    const lockKey = this.buildLockKey(key);

    const result = await this.redis.eval(
      RELEASE_LOCK_SCRIPT,
      1,
      lockKey,
      token,
    );

    return result === 1;
  }

  async execute<T>(
    key: string,
    ttlMs: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const token = await this.acquire(key, ttlMs);

    if (!token) {
      throw new LockAlreadyAcquiredException(key);
    }

    try {
      return await callback();
    } finally {
      await this.release(key, token);
    }
  }

  private buildLockKey(key: string): string {
    return `lock:${key}`;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
