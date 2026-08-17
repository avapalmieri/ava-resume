// Shared rate-limiting helper, backed by the same Vercel KV (Upstash Redis)
// database already used for the visitor log. Anything under api/_lib/ is
// ignored by Vercel's file-based routing (the leading underscore excludes
// it), so this stays a plain importable module, not a public endpoint.
//
// Fails OPEN by design: if KV isn't configured, or the KV call itself
// errors, checkRateLimit reports "not limited" rather than blocking
// visitors. A rate-limiter outage should never take down the actual
// feature it's protecting.

async function kvCommand(command) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error(`KV command failed: ${res.status}`);
  return res.json();
}

// Fixed-window counter under `key`, capped at `limit` hits per `windowSeconds`.
export async function checkRateLimit(key, limit, windowSeconds) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return { limited: false, count: 0 };
  }
  try {
    const incrRes = await kvCommand(['INCR', key]);
    const count = incrRes?.result ?? 0;
    if (count === 1) {
      await kvCommand(['EXPIRE', key, windowSeconds]);
    }
    return { limited: count > limit, count };
  } catch (err) {
    console.error('Rate limit check failed, failing open', err);
    return { limited: false, count: 0 };
  }
}

// Vercel sets x-forwarded-for on every request; take the first (client) hop.
export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}
