// Resolves a company display name from an email domain.
// Deliberately has zero external dependencies: Clearbit's free
// company-enrichment API (which this used to call) has been sunset in
// stages since March 2025, so it can no longer be relied on. Everything
// here is done locally, so this never fails and needs no API key.

const knownCompanies = {
  'google.com': 'Google', 'meta.com': 'Meta', 'apple.com': 'Apple',
  'microsoft.com': 'Microsoft', 'amazon.com': 'Amazon', 'openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic', 'netflix.com': 'Netflix', 'spotify.com': 'Spotify',
  'airbnb.com': 'Airbnb', 'uber.com': 'Uber', 'stripe.com': 'Stripe',
  'salesforce.com': 'Salesforce', 'ibm.com': 'IBM', 'nvidia.com': 'NVIDIA',
  'adobe.com': 'Adobe', 'palantir.com': 'Palantir', 'databricks.com': 'Databricks',
  'huggingface.co': 'Hugging Face', 'cohere.com': 'Cohere', 'mistral.ai': 'Mistral AI',
  'g.cofc.edu': 'College of Charleston'
};

const personalDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'live.com', 'aol.com', 'proton.me', 'protonmail.com'];

// Turns an arbitrary domain into a readable company guess, e.g.
// "cool-startup.io" -> "Cool Startup", "some.corp.co.uk" -> "Some Corp".
function formatDomainAsCompany(domain) {
  const multiPartTlds = ['co.uk', 'co.in', 'com.au', 'co.nz', 'co.za', 'com.br'];
  let base = domain;
  for (const tld of multiPartTlds) {
    if (base.endsWith('.' + tld)) {
      base = base.slice(0, -(tld.length + 1));
      break;
    }
  }
  if (base === domain) {
    base = base.split('.').slice(0, -1).join('.') || base;
  }
  const words = base.split(/[.\-_]+/).filter(Boolean);
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.body || {};
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Domain required' });
  }

  const normalized = domain.trim().toLowerCase();

  if (personalDomains.includes(normalized)) {
    return res.status(200).json({ company: null, source: 'personal' });
  }

  if (knownCompanies[normalized]) {
    return res.status(200).json({ company: knownCompanies[normalized], source: 'known' });
  }

  return res.status(200).json({ company: formatDomainAsCompany(normalized), source: 'fallback' });
}
