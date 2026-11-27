const { verify } = require('../lib/auth');
const store = require('../lib/store');
const seed = require('../lib/people');
const { isInternal } = require('../lib/teams');

const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const num = (v) => Math.min(1e12, Math.max(0, Number(v) || 0));

// Site visits and plot bookings.
function clean(a) {
  if (!a || typeof a !== 'object') throw bad('Missing data.');
  const o = {};
  o.id = str(a.id, 24);
  if (!/^a[a-z0-9]{3,22}$/.test(o.id)) throw bad('Invalid entry id.');
  o.t = a.t === 'book' ? 'book' : 'visit';
  o.m = str(a.m, 4);
  if (!/^\d{4}$/.test(o.m)) throw bad('Pick a member.');
  o.d = str(a.d, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.d)) throw bad('Pick a date.');
  o.c = str(a.c, 100);
  if (!o.c) throw bad('Enter the client name.');
  o.ty = o.t === 'book' ? (a.ty === 'FARM' ? 'FARM' : 'HMDA') : '';
  o.p = o.t === 'book' ? str(a.p, 60) : '';
  o.q = o.t === 'book' ? num(a.q) : 0;
  o.val = o.t === 'book' && o.ty === 'FARM' ? num(a.val) : 0;
  if (o.t === 'book' && !(o.q > 0)) throw bad('Enter the area in sq yd.');
  if (o.t === 'book' && o.ty === 'FARM' && !(o.val > 0)) throw bad('Enter the sale value for farm land.');
  o.del = !!a.del;
  return o;
}

module.exports = async (req, res) => {
  try {
    const role = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!role) return res.status(401).json({ message: 'Sign in first.' });
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      if (!store.enabled) return res.status(200).json([]);
      let acts = Object.values(await store.acts()).filter((a) => !a.del);
      if (role === 'viewer') {
        const hidden = new Set(Object.values(await store.members(seed)).filter((p) => isInternal(p.team)).map((p) => p.n));
        acts = acts.filter((x) => !hidden.has(x.m));
      }
      return res.status(200).json(acts);
    }

    if (req.method === 'POST') {
      if (role === 'viewer') return res.status(403).json({ message: 'Viewers cannot make changes.' });
      if (!store.enabled) return res.status(501).json({ message: 'Saving is not set up yet. Connect the database in Vercel.' });
      const c = clean((req.body || {}).act);
      const all = await store.acts();
      // Changing or deleting an existing entry is for the admin only.
      if (all[c.id] && role !== 'admin') return res.status(403).json({ message: 'Only the admin can change or delete entries.' });
      await store.putAct(c.id, c);
      return res.status(200).json({ act: c });
    }

    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error. Try again.' });
  }
};
