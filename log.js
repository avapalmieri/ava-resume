// Logs each visitor who submits the modal (email or company name) to a
// small Redis-backed list (Vercel KV / Upstash) and optionally sends an
// email alert via Resend. Both are best-effort: this endpoint always
// returns 200 so a logging hiccup never affects the visitor's experience,
// and it silently no-ops if the relevant env vars aren't configured yet.

async function kvCommand(command) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error(`KV command failed: ${res.status}`);
  return res.json();
}

async function sendAlertEmail(entry) {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_TO) return;
  const who = entry.company || entry.email || 'Someone';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL_TO,
      subject: `Resume view: ${who}`,
      text: `Someone viewed your resume.\n\nEmail: ${entry.email || 'n/a'}\nCompany: ${entry.company || 'n/a'}\nDomain: ${entry.domain || 'n/a'}\nTime: ${entry.timestamp}`
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, company, domain } = req.body || {};
  const entry = {
    email: email || null,
    company: company || null,
    domain: domain || null,
    timestamp: new Date().toISOString()
  };

  try {
    await kvCommand(['LPUSH', 'resume_views', JSON.stringify(entry)]);
  } catch (err) {
    console.error('Failed to write view log to KV', err);
  }

  try {
    await sendAlertEmail(entry);
  } catch (err) {
    console.error('Failed to send view alert email', err);
  }

  return res.status(200).json({ ok: true });
}
