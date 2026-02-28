# Schrijfoefening 📝

A mobile-first Dutch writing practice app for B1 learners. Daily prompts with LLM-powered feedback on prepositions and word forms.

## Features

- **Daily prompts** from a structured JSON file — rotating formats (verhaal, gesprek, beschrijving, mening)
- **Constrained writing** — each prompt targets specific verb+preposition pairs and de/het words
- **Ruled paper canvas** — distraction-free writing, no spell check, no dictionary
- **LLM feedback** via Claude API — inline annotations, scorecard, and warm coach summary
- **Streak tracking** — local persistence, no account needed
- **Error log** — automatically captures mistakes for spaced review

## Stack

Vanilla HTML, CSS, JavaScript (ES modules). No framework, no build step. Open `index.html` and go.

## Setup

1. Clone the repo
2. Get an API key from [console.anthropic.com](https://console.anthropic.com)
3. Open `index.html` in a browser (or serve locally with `npx serve .`)
4. Enter your API key when prompted — stored locally, never sent anywhere except Anthropic's API

```bash
git clone https://github.com/yourusername/schrijfoefening
cd schrijfoefening
npx serve .
```

> **Note:** The Anthropic API requires `anthropic-dangerous-direct-browser-access: true` for browser-based calls. Your key is stored in localStorage only.

## Adding Prompts

Prompts live in `data/prompts.json`. Each entry follows this structure:

```json
{
  "id": "dag-001",
  "dag": "Maandag",
  "format": "Vertel een verhaal",
  "prompt_nl": "Beschrijf een moment...",
  "constraints": {
    "preposities": ["houden van", "wachten op"],
    "woorden": [
      { "woord": "avontuur", "correct_meervoud": "avonturen", "artikel": "het" }
    ]
  },
  "min_zinnen": 5,
  "max_zinnen": 8
}
```

PRs with new prompt packs welcome!

## Project Structure

```
schrijfoefening/
├── index.html
├── data/
│   └── prompts.json
├── css/
│   ├── base.css        # Tokens, reset, typography
│   ├── components.css  # Buttons, chips, cards, sheets
│   └── screens.css     # Screen layouts
├── js/
│   ├── app.js          # Entry point, router
│   ├── prompt.js       # Prompt loading + rendering
│   ├── canvas.js       # Writing area logic
│   ├── feedback.js     # LLM API call
│   ├── annotation.js   # Highlight rendering, bottom sheet
│   └── storage.js      # localStorage: streak, error log, API key
└── README.md
```

## License

MIT
