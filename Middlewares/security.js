const requestWindows = new Map();

function sanitizeObject(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  const sanitizedEntries = Object.entries(value)
    .filter(([key]) => !key.startsWith("$") && !key.includes("."))
    .map(([key, nested]) => [key, sanitizeObject(nested)]);

  return Object.fromEntries(sanitizedEntries);
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:5173 http://127.0.0.1:5173 http://localhost:5174 http://127.0.0.1:5174; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';"
  );
  next();
}

export function mongoSanitize(req, res, next) {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}

export function rateLimit({ windowMs = 60_000, max = 60, keyGenerator } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const bucketKey = keyGenerator ? keyGenerator(req) : req.ip;
    const now = Date.now();
    const current = requestWindows.get(bucketKey) || { count: 0, startedAt: now };
    if (now - current.startedAt > windowMs) {
      requestWindows.set(bucketKey, { count: 1, startedAt: now });
      next();
      return;
    }

    if (current.count >= max) {
      res.status(429).json({ message: "Too many requests, please try again soon." });
      return;
    }

    current.count += 1;
    requestWindows.set(bucketKey, current);
    next();
  };
}
