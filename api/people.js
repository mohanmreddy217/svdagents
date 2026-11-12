const { verify } = require('../lib/auth');
const people = require('../lib/people');

module.exports = (req, res) => {
  const role = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
  if (!role) return res.status(401).json({ error: 'sign in first' });
  res.setHeader('Cache-Control', 'no-store');
  // Viewers never receive phone, Aadhaar, PAN, family name or address.
  const out = role === 'viewer'
    ? people.map(({ ph, aad, pan, fs, ad, ...rest }) => rest)
    : people;
  return res.status(200).json(out);
};
