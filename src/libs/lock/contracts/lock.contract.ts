import { LockWaitOptions } from './lock-wait-options.contract';

export interface ILock {
  acquire(key: string, ttlMs: number): Promise<string | null>;

  acquireWithWait(
    key: string,
    ttlMs: number,
    options: LockWaitOptions,
  ): Promise<string>;

  release(key: string, token: string): Promise<boolean>;

  execute<T>(
    key: string,
    ttlMs: number,
    callback: () => Promise<T>,
  ): Promise<T>;

  executeWithWait<T>(
    key: string,
    ttlMs: number,
    options: LockWaitOptions,
    callback: () => Promise<T>,
  ): Promise<T>;
}
