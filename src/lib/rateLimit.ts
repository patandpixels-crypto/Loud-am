const RATE_LIMITS: Record<string, { maxActions: number; windowMs: number }> = {
  post_create: { maxActions: 3, windowMs: 60 * 60 * 1000 }, // 3 posts per hour
  vote: { maxActions: 30, windowMs: 60 * 1000 }, // 30 votes per minute
  report: { maxActions: 5, windowMs: 60 * 60 * 1000 }, // 5 reports per hour
};

function getKey(action: string): string {
  return `loud_rate_${action}`;
}

export function checkRateLimit(action: string): { allowed: boolean; retryAfterMs: number } {
  if (typeof window === "undefined") return { allowed: true, retryAfterMs: 0 };

  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true, retryAfterMs: 0 };

  const key = getKey(action);
  const now = Date.now();

  const raw = localStorage.getItem(key);
  const timestamps: number[] = raw ? JSON.parse(raw) : [];

  // Remove expired timestamps
  const valid = timestamps.filter((t) => now - t < config.windowMs);

  if (valid.length >= config.maxActions) {
    const oldest = valid[0];
    const retryAfterMs = config.windowMs - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function recordAction(action: string): void {
  if (typeof window === "undefined") return;

  const config = RATE_LIMITS[action];
  if (!config) return;

  const key = getKey(action);
  const now = Date.now();

  const raw = localStorage.getItem(key);
  const timestamps: number[] = raw ? JSON.parse(raw) : [];

  const valid = timestamps.filter((t) => now - t < config.windowMs);
  valid.push(now);

  localStorage.setItem(key, JSON.stringify(valid));
}

export function formatRetryTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 1) return "a few seconds";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}
