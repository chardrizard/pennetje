// api/feedback.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, promptData } = req.body;
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing on the server' });
  }

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
    "preposities_correct": <aantal correct>,
    "preposities_totaal": <aantal totaal>,
    "dehet_fouten": <aantal fouten>,
    "doelwoorden_correct": <aantal correct>,
    "doelwoorden_totaal": <totaal>
  },
  "annotaties": [
    {
      "original": "<exact de tekst uit de schrijfoefening>",
      "correct": "<de correcte vorm>",
      "type": "woordvorm|prepositie|zinsbouw",
      "uitleg": "<één concrete zin uitleg in het Nederlands, vriendelijk>",
      "positief": <true of false>
    }
  ],
  "coach_samenvatting": "<3-4 zinnen als een echte tutor>"
}`;

  try {
    // Calling the Gemini API using the API key in the URL query parameters
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: text }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Gemini API Error' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch from LLM' });
  }
}
