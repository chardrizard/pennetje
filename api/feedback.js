// api/feedback.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, promptData } = req.body;

  // Access the secure environment variable (never exposed to the browser)
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing' });
  }

  // Build the system prompt on the server side
  const preposities = promptData.constraints.preposities.join(', ');
  const woorden = promptData.constraints.woorden
    .map(w => `"${w.woord}" (${w.artikel}-word, correct meervoud: "${w.correct_meervoud}")`)
    .join(', ');

  const systemPrompt = `Je bent een warme, aanmoedigende Nederlandse taaldocent (NT2) die feedback geeft aan een B1-leerder.

De leerder heeft een schrijfoefening gedaan met de volgende opdracht:
Prompt: "${promptData.prompt_nl}"

Doelwoorden om op te controleren:
- Voorzetsels/werkwoord+voorzetsel combinaties: ${preposities}
- Doelwoorden (let op de/het en meervoud): ${woorden}

Belangrijk: Geef alle details over de correcties, niet alleen de grootste of belangrijkste fouten. Elke kleine fout moet worden benoemd.

Geef feedback in deze JSON structuur, en ALLEEN JSON, geen andere tekst:
{
  "scorecard": {
    "preposities_correct": 0,
    "preposities_totaal": 0,
    "dehet_fouten": 0,
    "doelwoorden_correct": 0,
    "doelwoorden_totaal": 0
  },
  "annotaties": [ ... ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Change to your preferred model
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch from LLM' });
  }
}
