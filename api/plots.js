const { verify } = require('../lib/auth');
const store = require('../lib/store');

const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

const MAX_PLOT = { sricity: 107, srivanam: 91, srinivasam: 47 };
const VALID_ST = new Set(['ready', 'booked', 'sold', 'mortgage']);

function cleanPlot(p, role) {
  if (!p || typeof p !== 'object') throw bad('Missing plot data.');
  const proj = str(p.proj, 20).toLowerCase();
  const max = MAX_PLOT[proj];
  if (!max) throw bad('Unknown project.');
  const no = Number(p.no);
  if (!Number.isInteger(no) || no < 1 || no > max) throw bad('Invalid plot number.');
  const st = str(p.st, 20).toLowerCase();
  if (!VALID_ST.has(st)) throw bad('Invalid plot status.');
  const note = str(p.note, 120);
  const client = str(p.client, 80);
  return {
    id: `${proj}:${no}`,
    proj,
    no,
    st,
    client,
    note,
    by: role,
    at: new Date().toISOString(),
  };
}

const stripViewer = ({ id, proj, no, st, at }) => ({ id, proj, no, st, at });

module.exports = async (req, res) => {
  try {
    const role = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!role) return res.status(401).json({ message: 'Sign in first.' });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Persist', store.enabled ? '1' : '0');

    if (req.method === 'GET') {
      if (!store.enabled) return res.status(200).json([]);
      const list = Object.values(await store.plots());
      return res.status(200).json(role === 'viewer' ? list.map(stripViewer) : list);
    }

    if (req.method === 'POST') {
      if (role !== 'admin' && role !== 'editor') {
        return res.status(403).json({ message: 'Only Admin and Editor can change plot status.' });
      }
      if (!store.enabled) {
        return res.status(501).json({ message: 'Saving is not set up yet. Connect the database in Vercel.' });
      }
      const body = req.body || {};
      const rawList = Array.isArray(body.plots) ? body.plots : (body.plot ? [body.plot] : null);
      if (!rawList || !rawList.length) throw bad('Missing plot data.');
      if (rawList.length > 200) throw bad('Too many plots in one request.');

      const cleaned = rawList.map((item) => cleanPlot(item, role));
      if (cleaned.length === 1) {
        await store.putPlot(cleaned[0].id, cleaned[0]);
      } else {
        await store.putPlots(cleaned.map((c) => [c.id, c]));
      }
      return res.status(200).json({ plots: cleaned });
    }

    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (e) {
    return res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error. Try again.' });
  }
};
