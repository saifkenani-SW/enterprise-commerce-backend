import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@infra/cache';

@Injectable()
export class RedisRateLimitService {
  constructor(private readonly redis: RedisCacheService) {}

  async increment(key: string, ttlMs: number) {
    const script = `
      local current = redis.call("INCR", KEYS[1])

      if current == 1 then
        redis.call("PEXPIRE", KEYS[1], ARGV[1])
      end

      local ttl = redis.call("PTTL", KEYS[1])

      return { current, ttl }
    `;

    const result = (await this.redis.eval(
      script,
      1,
      key,
      ttlMs.toString(),
    )) as [number, number];

    return {
      totalHits: Number(result[0]),
      timeToExpire: Math.max(Number(result[1]), 0),
    };
  }
}
