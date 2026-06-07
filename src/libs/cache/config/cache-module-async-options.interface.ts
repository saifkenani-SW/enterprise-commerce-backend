import { ModuleMetadata, Type } from '@nestjs/common';

import { CacheModuleOptions } from './cache-module-options.interface';
export interface CacheOptionsFactory {
  createCacheOptions(): Promise<CacheModuleOptions> | CacheModuleOptions;
}

export interface CacheModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;

  inject?: any[];

  useClass?: Type<CacheOptionsFactory>;
}
