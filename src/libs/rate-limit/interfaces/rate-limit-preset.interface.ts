export interface RateLimitWindow {
  ttl: number;
  limit: number;
}

export interface RateLimitPreset {
  short: RateLimitWindow;
  long: RateLimitWindow;
}
