import { CacheSetOptions } from './cache-set-options.contract';

export interface ICache {
  get<T>(key: string): Promise<T | null>;

  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
