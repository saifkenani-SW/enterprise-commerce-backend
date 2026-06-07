import { SetMetadata } from '@nestjs/common';
import { RateLimitPresetName } from '../constants/rate-limit.presets';

export const RATE_LIMIT_KEY = 'rate-limit';

export const RateLimit = (preset: RateLimitPresetName) =>
  SetMetadata(RATE_LIMIT_KEY, preset);
