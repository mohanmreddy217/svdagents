const { verify } = require('../lib/auth');
const seed = require('../lib/people');
const store = require('../lib/store');

const strip = ({ ph, aad, pan, fs, ad, ...rest }) => rest; // viewers never get these

const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

// Checks every field of a member record and returns a clean copy.
function clean(r) {
  if (!r || typeof r !== 'object') throw bad('Missing member data.');
  const o = {};
  o.name = str(r.name, 80).toUpperCase();
  if (!o.name) throw bad('Name is required.');
  o.r = Number(r.r);
  if (!Number.isInteger(o.r) || o.r < 0 || o.r > 14) throw bad('Invalid designation.');
  o.ph = str(r.ph, 10);
  if (o.ph && !/^\d{10}$/.test(o.ph)) throw bad('Phone must be 10 digits.');
  o.d = str(r.d, 10);
  if (o.d && !/^\d{4}-\d{2}-\d{2}$/.test(o.d)) throw bad('Invalid joining date.');
  o.s = r.s === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  o.team = str(r.team, 60).toUpperCase();
  if (!o.team) throw bad('Team is required.');
  o.lead = !!r.lead;
  o.aad = str(r.aad, 12);
  if (o.aad && !/^[2-9]\d{11}$/.test(o.aad)) throw bad('Aadhaar must be 12 digits and cannot start with 0 or 1.');
  o.pan = str(r.pan, 10).toUpperCase();
  if (o.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(o.pan)) throw bad('PAN must look like ABCDE1234F.');
  o.fs = str(r.fs, 120).toUpperCase();
  o.sp = str(r.sp, 120).toUpperCase();
  o.ad = str(r.ad, 250).toUpperCase();
  o.dn = str(r.dn, 60).toUpperCase();
  if (o.r === 14 && !o.dn) throw bad('Type the designation for Others.');
  o.tv = Math.min(100000, Math.max(0, parseInt(r.tv, 10) || 0));
  o.tb = Math.min(100000, Math.max(0, parseInt(r.tb, 10) || 0));
  if (r.del) o.del = true;
  return o;
}

module.exports = async (req, res) => {
  try {
    const role = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!role) return res.status(401).json({ message: 'Sign in first.' });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Persist', store.enabled ? '1' : '0');

    if (req.method === 'GET') {
      let list = seed;
      if (store.enabled) list = Object.values(await store.members(seed)).filter((p) => !p.del);
      list = list.slice().sort((a, b) => a.n.localeCompare(b.n));
      return res.status(200).json(role === 'viewer' ? list.map(strip) : list);
    }

    if (req.method === 'POST') {
      if (role === 'viewer') return res.status(403).json({ message: 'Viewers cannot make changes.' });
      if (!store.enabled) return res.status(501).json({ message: 'Saving is not set up yet. Connect the database in Vercel.' });
      const { rec, isNew } = req.body || {};
      const c = clean(rec);
      if (c.del && role !== 'admin') return res.status(403).json({ message: 'Only the admin can delete.' });
      const all = await store.members(seed);
      let n;
      if (isNew) {
        n = String(Math.max(99, ...Object.keys(all).map(Number)) + 1).padStart(4, '0');
      } else {
        n = String((rec && rec.n) || '');
        if (!all[n]) return res.status(404).json({ message: 'Member not found.' });
      }
      if (c.aad && !c.del) {
        const other = Object.values(all).find((p) => p.aad === c.aad && p.n !== n && !p.del);
        if (other) return res.status(409).json({ message: 'This Aadhaar number already belongs to ' + other.name + ' (' + other.team + ').' });
      }
      const stored = { ...(all[n] || {}), ...c, n };
      if (!c.del) delete stored.del;
      await store.putMember(n, stored);
      return res.status(200).json({ rec: stored });
    }

    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error. Try again.' });
  }
};
#$$$$