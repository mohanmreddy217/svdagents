const store = require('../lib/store');

// Open /api/status in the browser to see whether saving is switched on. It shows names only, never secrets.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const has = (k) => !!process.env[k];
  res.status(200).json({
    saving: store.enabled,
    databaseVariablesFound: store.names,
    passwordsSet: { ADMIN_PASSWORD: has('ADMIN_PASSWORD'), EDITOR_PASSWORD: has('EDITOR_PASSWORD'), VIEWER_PASSWORD: has('VIEWER_PASSWORD'), AUTH_SECRET: has('AUTH_SECRET') },
  });
};
