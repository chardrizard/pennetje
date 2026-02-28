// feedback.js

export async function getFeedback(text, prompt) {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text, promptData: prompt })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || \`API error: \${response.status}\`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';

  // Strip markdown fences if present before parsing
  const cleaned = rawText.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
  return JSON.parse(cleaned);
}
