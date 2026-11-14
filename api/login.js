const { make, same } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.AUTH_SECRET) return res.status(500).json({ error: 'not configured' });
  const { u, p } = req.body || {};
  const role = String(u || '').toLowerCase();
  const pw = { admin: process.env.ADMIN_PASSWORD, editor: process.env.EDITOR_PASSWORD, viewer: process.env.VIEWER_PASSWORD }[role];
  if (!pw) return res.status(401).json({ error: 'bad login' });
  if (!same(p || '', pw)) {
    await new Promise((r) => setTimeout(r, 700)); // slows down password guessing
    return res.status(401).json({ error: 'bad login' });
  }
  return res.status(200).json({ role, token: make(role) });
};
