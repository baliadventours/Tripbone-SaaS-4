import { Request, Response, NextFunction } from "express";

/**
 * In-Memory Rate Limiter Store
 * Cleans up expired entries automatically to avoid memory leaks.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipLimitsStore = new Map<string, RateLimitRecord>();

// Periodically clean up stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipLimitsStore.entries()) {
    if (now > record.resetTime) {
      ipLimitsStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds (e.g. 60000 for 1 minute)
  max: number; // Max requests per IP within the window
  message?: string;
  keyPrefix?: string;
}

/**
 * Express Rate Limiting Middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 60;
  const message = options.message || "Too many requests, please try again later.";
  const keyPrefix = options.keyPrefix || "rl";

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP (considering standard proxies)
    const clientIp = 
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || 
      req.socket.remoteAddress || 
      "unknown_ip";

    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let record = ipLimitsStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipLimitsStore.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: resetSeconds,
      });
    }

    next();
  };
}

/**
 * Security Headers Middleware
 * Protects against MIME sniffing, clickjacking, and XSS exploits.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Download-Options", "noopen");
  
  // Disable powered-by header
  res.removeHeader("X-Powered-By");

  next();
}

/**
 * Sanitize a string input to prevent dangerous injections or buffer overflows
 */
export function sanitizeString(input: any, maxLength = 10000): string {
  if (typeof input !== "string") return "";
  let clean = input.replace(/\0/g, "").trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
}

/**
 * Recursively sanitize an object payload
 */
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Prevent prototype pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      cleaned[key] = sanitizePayload(value);
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Input sanitization middleware for incoming JSON request bodies
 */
export function sanitizeBodyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizePayload(req.body);
  }
  next();
}
