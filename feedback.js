// feedback.js

export async function getFeedback(text, prompt) {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text, promptData: prompt })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract text from Gemini's specific response structure
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip markdown fences if present before parsing
  const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
