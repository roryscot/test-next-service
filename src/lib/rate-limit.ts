// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create rate limiter instance
// For development, we'll use a simple in-memory rate limiter
// In production, you'd use Redis with Upstash
const createRateLimiter = () => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.UPSTASH_REDIS_REST_URL
  ) {
    // Production: Use Upstash Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
      analytics: true,
    });
  } else {
    // Development: Use simple in-memory rate limiter
    const requests = new Map<string, { count: number; resetTime: number }>();

    return {
      limit: async (identifier: string) => {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const maxRequests = 10;

        const key = identifier;
        const current = requests.get(key);

        if (!current || now > current.resetTime) {
          // Reset window
          requests.set(key, { count: 1, resetTime: now + windowMs });
          return {
            success: true,
            limit: maxRequests,
            remaining: maxRequests - 1,
            reset: current?.resetTime || now + windowMs,
          };
        }

        if (current.count >= maxRequests) {
          return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            reset: current.resetTime,
          };
        }

        current.count++;
        requests.set(key, current);

        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - current.count,
          reset: current.resetTime,
        };
      },
    };
  }
};

export const rateLimiter = createRateLimiter();

// Rate limit helper for API routes
export async function checkRateLimit(
  request: Request
): Promise<{ success: boolean; response?: Response }> {
  try {
    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    const { success, reset } = await rateLimiter.limit(ip);

    if (!success) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            code: "RATE_LIMIT",
            retryAfter: Math.ceil((reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": "10",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        ),
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open - allow request if rate limiting fails
    return { success: true };
  }
}
