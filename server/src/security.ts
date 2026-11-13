import { isIP } from "node:net";

type RequestLike = {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
    socket?: {
        remoteAddress?: string;
    };
};

type RateLimitOptions = {
    max: number;
    windowMs: number;
    message: string;
};

type Bucket = {
    count: number;
    resetsAt: number;
};

const MAX_BUCKETS = 50000;

// Render routes public traffic through Cloudflare, which supplies this header.
// Fall back to Express's IP for local development and non-Cloudflare hosts.
/*
 * DOCU: Handle client ip behavior for this feature.
 * @param {RequestLike} req - Express request containing route input and session data
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function clientIp(req: RequestLike) {
    const forwardedIp = req.headers["cf-connecting-ip"];
    const cloudflareIp = Array.isArray(forwardedIp) ? forwardedIp[0] : forwardedIp;
    if (cloudflareIp && isIP(cloudflareIp.trim())) {
        return cloudflareIp.trim();
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
}

/*
 * DOCU: Create rate limiter for this feature.
 * @param {RateLimitOptions} options - options value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function createRateLimiter(options: RateLimitOptions) {
    const buckets = new Map<string, Bucket>();
    let lastCleanup = 0;

    return (req: any, res: any, next: any) => {
        const now = Date.now();
        if (now - lastCleanup >= 60000) {
            for (const [key, bucket] of buckets) {
                if (bucket.resetsAt <= now) {
                    buckets.delete(key);
                }
            }
            lastCleanup = now;
        }

        const ip = clientIp(req);
        let bucket = buckets.get(ip);
        if (!bucket || bucket.resetsAt <= now) {
            if (!bucket && buckets.size >= MAX_BUCKETS) {
                res.setHeader("Retry-After", "60");
                res.setHeader("Cache-Control", "no-store");
                res.status(429).json({ error: "Too many requests. Try again shortly." });
                return;
            }
            bucket = {
                count: 0,
                resetsAt: now + options.windowMs
            };
            buckets.set(ip, bucket);
        }

        bucket.count += 1;
        if (bucket.count > options.max) {
            res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000))));
            res.setHeader("Cache-Control", "no-store");
            res.status(429).json({ error: options.message });
            return;
        }

        next();
    };
}

/*
 * DOCU: Handle log safe error behavior for this feature.
 * @param {string} label - label value used by this function
 * @param {unknown} error - Error details to handle or display
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function logSafeError(label: string, error: unknown) {
    const code = (error as { code?: unknown } | null)?.code;
    const safeCode = typeof code === "string" && /^[A-Z0-9_]{1,64}$/.test(code) ? code : "UNKNOWN";
    console.error(label, {
        code: safeCode
    });
}
