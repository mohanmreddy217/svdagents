const crypto = require('crypto');
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (d) => crypto.createHmac('sha256', process.env.AUTH_SECRET || '').update(d).digest('base64url');

// Create a signed token that expires after 8 hours.
exports.make = (role) => {
  const p = b64(JSON.stringify({ role, exp: Date.now() + 8 * 3600 * 1000 }));
  return p + '.' + sign(p);
};

// Returns the role inside a valid token, or null.
exports.verify = (t) => {
  try {
    if (!t || !process.env.AUTH_SECRET) return null;
    const [p, s] = String(t).split('.');
    if (!p || !s) return null;
    const a = Buffer.from(s), b = Buffer.from(sign(p));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const o = JSON.parse(Buffer.from(p, 'base64url').toString());
    return o.exp > Date.now() ? o.role : null;
  } catch (e) { return null; }
};

// Constant-time password comparison.
exports.same = (a, b) => {
  const h = (x) => crypto.createHash('sha256').update(String(x)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
};
