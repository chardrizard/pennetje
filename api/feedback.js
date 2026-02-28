// api/feedback.js — Vercel Serverless Function
// Proxies writing feedback requests to Gemini API
// Keeps API key server-side, handles CORS for cross-origin requests from GitHub Pages

// ── CORS helper ──────────────────────────────────────────
function setCorsHeaders(res) {
  // TODO: Replace '*' with your GitHub Pages domain for production security
  // e.g. 'https://yourusername.github.io'
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  // ── Always set CORS headers (including on errors) ──────
  setCorsHeaders(res);

  // ── Handle preflight OPTIONS request ───────────────────
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Only allow POST ────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Validate request body ──────────────────────────────
  const { text, promptData } = req.body || {};

  if (!text || !promptData) {
    return res.status(400).json({ error: 'Missing required fields: text, promptData' });
  }

  // ── Read API key from Vercel environment variable ──────
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    console.error('LLM_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'API key is not configured on the server' });
  }

  // ── Build the system prompt ────────────────────────────
  const preposities = promptData.constraints.preposities.join(', ');
  const woorden = promptData.constraints.woorden
    .map(w => {
      const meervoud = w.correct_meervoud || w.meervoud;
      return `"${w.woord}" (${w.artikel}-woord, meervoud: "${meervoud}")`;
    })
    .join(', ');

  const systemPrompt = `Je bent Pennetje — een warme, directe NT2-taaldocent voor B1-leerders.

Schrijfopdracht: "${promptData.prompt_nl}"
Doelvoorzetsels: ${preposities}
Doelwoorden: ${woorden}

Geef ALLEEN deze JSON terug, geen markdown, geen uitleg buiten JSON:
{
  "scorecard": {
    "preposities_correct": <getal>,
    "preposities_totaal": <getal>,
    "dehet_fouten": <getal>,
    "doelwoorden_correct": <getal>,
    "doelwoorden_totaal": <getal>
  },
  "annotaties": [
    {
      "original": "<exacte tekst uit de oefening>",
      "correct": "<correcte versie>",
      "type": "woordvorm|prepositie|zinsbouw|goed",
      "uitleg": "<één zin: wat is de regel in het Nederlands>",
      "positief": false
    }
  ],
  "coach_samenvatting": "<2-3 zinnen: één concreet compliment, één verbeterpunt, bemoedigend einde>"
}

Regels:
- Maximaal 4 annotaties totaal
- "original" moet EXACT overeenkomen met tekst van de leerder
- Wees nooit generiek — verwijs altijd naar wat de leerder echt schreef
- "type" is altijd één van de vier genoemde waarden`;

  // ── Call Gemini API ────────────────────────────────────
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `Gemini HTTP ${response.status}`;
      console.error('Gemini API error:', msg);
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Failed to call Gemini:', error);
    return res.status(500).json({ error: 'Failed to fetch from LLM' });
  }
}
