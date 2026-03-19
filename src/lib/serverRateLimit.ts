const rateLimitMap = new Map<string, number[]>();

const RATE_CONFIGS: Record<string, { maxRequests: number; windowMs: number }> = {
  "grant-access": { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute per IP
  "paystack-verify": { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute per IP
};

// Cleanup stale entries every 5 minutes
if (typeof globalThis !== "undefined") {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const valid = timestamps.filter((t) => now - t < 5 * 60 * 1000);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  };
  setInterval(cleanup, 5 * 60 * 1000).unref?.();
}

export function checkServerRateLimit(
  ip: string,
  action: string
): { allowed: boolean; retryAfterMs: number } {
  const config = RATE_CONFIGS[action];
  if (!config) return { allowed: true, retryAfterMs: 0 };

  const key = `${action}:${ip}`;
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const valid = timestamps.filter((t) => now - t < config.windowMs);

  if (valid.length >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - valid[0]);
    return { allowed: false, retryAfterMs };
  }

  valid.push(now);
  rateLimitMap.set(key, valid);
  return { allowed: true, retryAfterMs: 0 };
}
