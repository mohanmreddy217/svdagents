const { verify } = require('../lib/auth');
const store = require('../lib/store');

const bad = (message, status = 400) => Object.assign(new Error(message), { status });
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

const MAX_PLOT = { sricity: 107, srivanam: 91, srinivasam: 47, sirivanam: 67, svapts: 506 };
const VALID_ST = new Set(['ready', 'booked', 'sold', 'mortgage']);

function cleanPlot(p, role) {
  if (!p || typeof p !== 'object') throw bad('Missing plot data.');
  const proj = str(p.proj, 20).toLowerCase();
  const max = MAX_PLOT[proj];
  if (!max) throw bad('Unknown project.');
  const no = Number(p.no);
  if (!Number.isInteger(no) || no < 1 || no > max) throw bad('Invalid plot number.');
  const apt = proj === 'svapts';
  // SV Apartments: flat number = floor * 100 + flat (floors 1-5, flats 1-6 per floor).
  if (apt && (Math.floor(no / 100) < 1 || Math.floor(no / 100) > 5 || no % 100 < 1 || no % 100 > 6)) throw bad('Invalid flat number.');
  const st = str(p.st, 20).toLowerCase();
  if (!VALID_ST.has(st)) throw bad('Invalid plot status.');
  const note = str(p.note, 120);
  const marketer = str(p.marketer != null ? p.marketer : p.client, 80);
  const rec = {
    id: `${proj}:${no}`,
    proj,
    no,
    st,
    marketer,
    note,
    by: role,
    at: new Date().toISOString(),
  };
  if (apt) {
    const area = p.area === '' || p.area == null ? '' : Number(p.area);
    if (area !== '' && (!Number.isFinite(area) || area < 1 || area > 5000)) throw bad('Area must be between 1 and 5000 sq ft.');
    rec.phone = str(p.phone, 20);
    rec.area = area;
    rec.bhk = str(p.bhk, 10);
    rec.price = str(p.price, 20);
    const face = str(p.face, 2).toUpperCase();
    rec.face = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].includes(face) ? face : '';
  }
  return rec;
}

const stripViewer = ({ id, proj, no, st, at, area, bhk, price, face, marketer, client }) => ({ id, proj, no, st, at, area, bhk, price, face, marketer: marketer || client || '' });

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
