// feedback.js — LLM API call and response parsing

import { getApiKey } from './storage.js';

function buildSystemPrompt(prompt) {
  const preposities = prompt.constraints.preposities.join(', ');
  const woorden = prompt.constraints.woorden
    .map(w => `"${w.woord}" (${w.artikel}-word, correct meervoud: "${w.correct_meervoud}")`)
    .join(', ');

  return `Je bent een warme, aanmoedigende Nederlandse taaldocent (NT2) die feedback geeft aan een B1-leerder.

De leerder heeft een schrijfoefening gedaan met de volgende opdracht:
Prompt: "${prompt.prompt_nl}"

Doelwoorden om op te controleren:
- Voorzetsels/werkwoord+voorzetsel combinaties: ${preposities}
- Doelwoorden (let op de/het en meervoud): ${woorden}

Geef feedback in deze JSON structuur, en ALLEEN JSON, geen andere tekst:

{
  "scorecard": {
    "preposities_correct": <aantal correct gebruikte doelvoorzetsels>,
    "preposities_totaal": <aantal doelvoorzetsels die ze hadden moeten gebruiken>,
    "dehet_fouten": <aantal de/het of meervoud fouten>,
    "doelwoorden_correct": <aantal doelwoorden correct gebruikt>,
    "doelwoorden_totaal": <totaal aantal doelwoorden>
  },
  "annotaties": [
    {
      "original": "<exact de tekst uit de schrijfoefening>",
      "correct": "<de correcte vorm>",
      "type": "woordvorm|prepositie|zinsbouw",
      "uitleg": "<één concrete zin uitleg in het Nederlands, vriendelijk>",
      "positief": <true als het goed is, false als het een fout is>
    }
  ],
  "coach_samenvatting": "<3-4 zinnen als een echte tutor: noem één specifiek goed punt, één specifiek verbeterpunt, eindig bemoedigend. Gebruik 'je' en schrijf in de tweede persoon. Nooit generiek.>"
}

Regels:
- Geef maximaal 4 annotaties (mix van goed en fout)
- Wees specifiek, nooit generiek
- Toon altijd meer positieven dan negatieven als dat mogelijk is
- De coach_samenvatting moet persoonlijk en specifiek zijn`;
}

export async function getFeedback(userText, prompt) {
  const apiKey = getApiKey();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: buildSystemPrompt(prompt),
      messages: [
        {
          role: 'user',
          content: userText,
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';

  // Strip markdown fences if present
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
