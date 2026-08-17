const BACKGROUND = 'Background: B.S. Computer Information Systems College of Charleston 2026 Graduate focus AI and ML. AI Intern at Querri building RAG systems with OpenAI and Qdrant. ClearLand geospatial AI project. Closet Companion computer vision app. Skills: Python JavaScript TensorFlow PyTorch OpenCV MongoDB Qdrant REST APIs Agile.';

// A hand-written fallback used whenever the Claude API call can't complete
// (missing/invalid ANTHROPIC_API_KEY, rate limit, network hiccup, etc.), so
// visitors never see a raw error or the literal text "undefined".
function fallbackLetter(company) {
  const target = company ? `the team at ${company}` : 'your team';
  return `I'm Ava Palmieri, an AI developer graduating from the College of Charleston in 2026 with a focus on AI and machine learning. I'm reaching out because I'd love to bring that background to ${target}.\n\n` +
    `As an AI Intern at Querri, I build production RAG systems with OpenAI and Qdrant, and I've shipped projects like ClearLand, a geospatial AI tool for detecting zoning violations, and Closet Companion, a computer vision app for outfit recommendations. I care about building AI that solves real problems, not just demos well.\n\n` +
    `I'd welcome the chance to talk about how I could contribute. Thank you for your time and consideration.\n\nAva Palmieri`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company } = req.body || {};

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set — serving fallback cover letter.');
    return res.status(200).json({ letter: fallbackLetter(company), source: 'fallback' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: 'Write a warm, confident 3-paragraph cover letter from Ava Palmieri to the hiring team at ' +
            (company || 'the company') +
            '. No em dashes. Brief experience mentions only. Focus on why she is drawn to ' + (company || 'the company') +
            ' and what she brings. Warm and direct. Do not start with I am writing to express my interest. Sign off as Ava Palmieri. ' +
            BACKGROUND
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error', response.status, errBody);
      return res.status(200).json({ letter: fallbackLetter(company), source: 'fallback' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) {
      console.error('No content in Anthropic response', JSON.stringify(data));
      return res.status(200).json({ letter: fallbackLetter(company), source: 'fallback' });
    }

    return res.status(200).json({ letter: text, source: 'claude' });
  } catch (err) {
    console.error('generate.js failed', err);
    return res.status(200).json({ letter: fallbackLetter(company), source: 'fallback' });
  }
}
