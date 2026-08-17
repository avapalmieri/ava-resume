// Returns the logged list of visitors. Protected by a shared-secret query
// param (LOG_SECRET env var) rather than real auth, since this is a
// single-owner personal site. Keep LOG_SECRET private -- anyone with it
// can read the log.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = req.query.key;
  if (!process.env.LOG_SECRET || key !== process.env.LOG_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(200).json({ entries: [], note: 'No database connected yet — add a Vercel KV database and redeploy.' });
  }

  try {
    const kvRes = await fetch(process.env.KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['LRANGE', 'resume_views', '0', '499'])
    });
    const data = await kvRes.json();
    const entries = (data.result || [])
      .map(s => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean);
    return res.status(200).json({ entries });
  } catch (err) {
    console.error('Failed to read view log', err);
    return res.status(500).json({ error: 'Failed to load log' });
  }
}
