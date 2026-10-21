const EDGE = 'https://hacdlxguzipxujhtrysl.supabase.co/functions/v1/site-admin';

module.exports = async function handler(req, res) {
  const action = String(req.query?.action || 'public');
  if (action === 'logout') {
    res.setHeader('Set-Cookie', `jaques_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.status(200).json({ ok: true });
    return;
  }
  const cookies = Object.fromEntries(String(req.headers.cookie || '').split(';').map((item) => item.trim().split(/=(.*)/s).slice(0, 2)).filter(([name]) => name));
  const headers = { 'Content-Type': req.headers['content-type'] || 'application/json', 'X-Forwarded-For': req.headers['x-forwarded-for'] || req.socket.remoteAddress || '' };
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
    const body = req.body || {};
    const response = await fetch(`${EDGE}?action=login`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(data);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `jaques_admin=${encodeURIComponent(data.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800${secure}`);
    return res.status(200).json({ ok: true });
  }
  if (cookies.jaques_admin) headers['x-admin-session'] = decodeURIComponent(cookies.jaques_admin);
  const query = new URLSearchParams(req.query || {}).toString();
  const init = { method: req.method, headers };
  if (!['GET', 'HEAD'].includes(req.method)) init.body = req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : req;
  const response = await fetch(`${EDGE}?${query}`, init);
  res.status(response.status);
  res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(await response.text());
};

module.exports.config = { api: { bodyParser: { sizeLimit: '16mb' } } };
