// ── Input validation helpers (same pattern as memoir) ────────────────

/** Validate email format (basic RFC 5322 check) */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Sanitize and limit a string field */
export function sanitizeString(
  value: unknown,
  maxLength: number = 200
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

// ── Rate limiting ────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const rateLimitMaps = new Map<string, Map<string, RateLimitEntry>>();

/**
 * In-memory rate limiter keyed by namespace + identifier (IP or user id).
 * Resets on process restart, which is fine for abuse protection.
 */
export function checkRateLimit(
  namespace: string,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  if (!rateLimitMaps.has(namespace)) {
    rateLimitMaps.set(namespace, new Map());
  }
  const map = rateLimitMaps.get(namespace)!;
  const now = Date.now();

  // Occasionally sweep stale entries
  if (Math.random() < 0.01) {
    for (const [k, entry] of map) {
      if (now - entry.firstAttempt > windowMs) {
        map.delete(k);
      }
    }
  }

  const entry = map.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    map.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterMs = windowMs - (now - entry.firstAttempt);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterMs: 0,
  };
}

/** Extract client IP from request headers (nginx sets X-Real-IP) */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
