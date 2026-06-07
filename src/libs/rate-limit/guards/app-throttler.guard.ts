import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { Request, Response } from 'express';

import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { RATE_LIMIT_PRESETS } from '../constants/rate-limit.presets';
import { RedisRateLimitService } from '../services/redis-rate-limit.service';

@Injectable()
export class AppThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(AppThrottlerGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: RedisRateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const res = context.switchToHttp().getResponse<Response>();

    const presetName = this.reflector.getAllAndOverride<string>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!presetName) {
      return true;
    }

    const preset = RATE_LIMIT_PRESETS[presetName];

    if (!preset) {
      return true;
    }

    const tracker = this.getTracker(req);

    try {
      await this.checkLimit({
        req,
        res,
        tracker,
        limit: preset.short.limit,
        ttl: preset.short.ttl,
        keySuffix: 'short',
        headerPrefix: 'Short',
      });

      await this.checkLimit({
        req,
        res,
        tracker,
        limit: preset.long.limit,
        ttl: preset.long.ttl,
        keySuffix: 'long',
        headerPrefix: 'Long',
      });

      return true;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error;
      }

      this.logger.error(
        `Rate limiter failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Fail Open
      return true;
    }
  }

  private getTracker(req: Request): string {
    const actor = (req as any).user;

    if (actor?.id) {
      return `user:${actor.id}`;
    }

    return `ip:${req.ips?.[0] || req.ip}`;
  }

  private async checkLimit({
    req,
    res,
    tracker,
    limit,
    ttl,
    keySuffix,
    headerPrefix,
  }: {
    req: Request;
    res: Response;
    tracker: string;
    limit: number;
    ttl: number;
    keySuffix: string;
    headerPrefix: string;
  }) {
    const route = `${req.baseUrl}${req.route?.path ?? ''}`;

    const key = `rate-limit:${req.method}:${route}:${tracker}:${keySuffix}`;

    const { totalHits, timeToExpire } = await this.limiter.increment(key, ttl);

    res.header(`X-RateLimit-${headerPrefix}-Limit`, limit.toString());

    res.header(
      `X-RateLimit-${headerPrefix}-Remaining`,
      Math.max(limit - totalHits, 0).toString(),
    );

    res.header(
      `X-RateLimit-${headerPrefix}-Reset`,
      Math.ceil(timeToExpire / 1000).toString(),
    );

    if (totalHits <= limit) {
      return;
    }

    this.logger.warn(
      [
        'Rate limit exceeded',
        `tracker=${tracker}`,
        `route=${route}`,
        `method=${req.method}`,
        `ip=${req.ip}`,
        `hits=${totalHits}`,
        `limit=${limit}`,
      ].join(' | '),
    );

    res.header('Retry-After', Math.ceil(timeToExpire / 1000).toString());

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        retryAfter: Math.ceil(timeToExpire / 1000),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
