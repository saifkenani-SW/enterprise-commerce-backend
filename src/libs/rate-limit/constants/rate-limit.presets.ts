import { RateLimitPreset } from '../interfaces/rate-limit-preset.interface';

export const RATE_LIMIT_PRESETS = {
  AUTH: {
    short: {
      ttl: 60_000,
      limit: 5,
    },

    long: {
      ttl: 60 * 60 * 1000,
      limit: 20,
    },
  },

  ALTCHA: {
    short: {
      ttl: 60_000,
      limit: 10,
    },

    long: {
      ttl: 60 * 60 * 1000,
      limit: 100,
    },
  },

  ATTACHMENT_UPLOAD: {
    short: {
      ttl: 60_000,
      limit: 10,
    },

    long: {
      ttl: 24 * 60 * 60 * 1000,
      limit: 100,
    },
  },

  PUBLIC_API: {
    short: {
      ttl: 60_000,
      limit: 60,
    },

    long: {
      ttl: 60 * 60 * 1000,
      limit: 1000,
    },
  },
} as const satisfies Record<string, RateLimitPreset>;

export type RateLimitPresetName = keyof typeof RATE_LIMIT_PRESETS;
export const RateLimitPresets = {
  AUTH: 'AUTH',
  ALTCHA: 'ALTCHA',
  ATTACHMENT_UPLOAD: 'ATTACHMENT_UPLOAD',
  PUBLIC_API: 'PUBLIC_API',
} as const;
