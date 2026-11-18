// Small storage helper for an Upstash Redis database (the free "Redis" option in Vercel Storage).
// It talks to the database over HTTPS, so no extra packages are needed.
// Vercel names these variables differently depending on the prefix chosen when the database
// was connected (KV_..., UPSTASH_REDIS_..., STORAGE_..., etc.), so look for any matching pair.
const env = process.env;
const pick = (names, re, skip) =>
  names.find((k) => env[k]) || Object.keys(env).find((k) => re.test(k) && !(skip && skip.test(k)) && env[k]);
const urlKey = pick(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'], /REST(_API)?_URL$/);
const tokenKey = pick(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'], /REST(_API)?_TOKEN$/, /READ_ONLY/);
const url = urlKey && env[urlKey];
const token = tokenKey && env[tokenKey];
exports.names = { url: urlKey || null, token: tokenKey || null }; // names only, never the values

exports.enabled = !!(url && token);

async function cmd(args) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Read a whole hash as { field: parsedJson }.
async function readAll(key) {
  const flat = (await cmd(['HGETALL', key])) || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = JSON.parse(flat[i + 1]);
  return out;
}

// Members: filled once from lib/people.js the first time the database is empty.
exports.members = async (seed) => {
  let all = await readAll('sv:members');
  if (!Object.keys(all).length) {
    const args = ['HSET', 'sv:members'];
    seed.forEach((p) => args.push(p.n, JSON.stringify(p)));
    await cmd(args);
    all = await readAll('sv:members');
  }
  return all;
};
exports.putMember = (n, rec) => cmd(['HSET', 'sv:members', n, JSON.stringify(rec)]);
exports.acts = () => readAll('sv:acts');
exports.putAct = (id, rec) => cmd(['HSET', 'sv:acts', id, JSON.stringify(rec)]);
