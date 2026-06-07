import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import Redis from 'ioredis';
import { randomUUID } from 'crypto';

import { REDIS_TOKEN } from '@infra/cache';

import { ILock } from '../contracts/lock.contract';
import { LockWaitOptions } from '../contracts/lock-wait-options.contract';

import { RELEASE_LOCK_SCRIPT } from '../lua/release-lock.lua';

import { LockAlreadyAcquiredException } from '../exceptions/lock-already-acquired.exception';
import { LockTimeoutException } from '../exceptions/lock-timeout.exception';

@Injectable()
export class RedisLockService implements ILock, OnModuleInit {
  private static readonly DEFAULT_RETRY_DELAY_MS = 50;

  private static readonly MAX_BACKOFF_DELAY_MS = 1000;

  constructor(
    @Inject(REDIS_TOKEN)
    private readonly redis: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
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

    const startedAt = Date.now();

    const baseDelayMs =
      options.retryDelayMs ?? RedisLockService.DEFAULT_RETRY_DELAY_MS;

    let attempt = 0;

    while (Date.now() - startedAt < options.timeoutMs) {
      const token = await this.acquire(key, ttlMs);

      if (token) {
        return token;
      }

      attempt++;

      const exponentialDelay = Math.min(
        RedisLockService.MAX_BACKOFF_DELAY_MS,
        baseDelayMs * Math.pow(2, attempt),
      );

      // Full Jitter
      const sleepMs = Math.floor(Math.random() * exponentialDelay);

      const elapsedMs = Date.now() - startedAt;

      const remainingMs = options.timeoutMs - elapsedMs;

      if (remainingMs <= 0) {
        break;
      }

      await this.sleep(Math.min(sleepMs, remainingMs));
    }

    throw new LockTimeoutException(key);
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

  async executeWithWait<T>(
    key: string,
    ttlMs: number,
    options: LockWaitOptions,
    callback: () => Promise<T>,
  ): Promise<T> {
    const token = await this.acquireWithWait(key, ttlMs, options);

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
