// app.js — Entry point, screen router, event wiring

import { loadTodayPrompt, getCurrentPrompt, renderHomePrompt, renderCanvasConstraints } from './prompt.js';
import { initCanvas, resetCanvas, focusCanvas } from './canvas.js';
import { getFeedback } from './feedback.js';
import { renderAnnotatedText, renderScorecard, renderCoachSummary, initBottomSheet } from './annotation.js';
import { getApiKey, setApiKey, getStreak, incrementStreak } from './storage.js';

// ---- Screen Management ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');
  window.scrollTo(0, 0);
}

// ---- Feedback Flow ----
let lastUserText = '';

async function handleSubmit(text) {
  lastUserText = text;
  const prompt = getCurrentPrompt();

  showScreen('screen-feedback');

  // Reset feedback UI
  document.getElementById('feedback-loading').classList.remove('hidden');
  document.getElementById('feedback-content').classList.add('hidden');
  document.getElementById('feedback-error').classList.add('hidden');

  try {
    const feedback = await getFeedback(text, prompt);

    // Render scorecard
    renderScorecard(feedback.scorecard);

    // Render annotated text
    renderAnnotatedText(text, feedback.annotaties || []);

    // Render coach summary
    renderCoachSummary(feedback.coach_samenvatting);

    // Show content, hide loading
    document.getElementById('feedback-loading').classList.add('hidden');
    document.getElementById('feedback-content').classList.remove('hidden');

  } catch (err) {
    console.error('Feedback error:', err);
    document.getElementById('feedback-loading').classList.add('hidden');
    document.getElementById('feedback-error').classList.remove('hidden');
  }
}

// ---- Init ----
async function init() {
  // Load streak
  const streak = getStreak();
  document.getElementById('streak-count').textContent = streak;

  // Load today's prompt
  try {
    const prompt = await loadTodayPrompt();
    renderHomePrompt(prompt);
  } catch (err) {
    console.error('Failed to load prompt:', err);
    document.getElementById('home-prompt-text').textContent =
      'Beschrijf je dag in 5–8 zinnen. Gebruik zoveel mogelijk Nederlands!';
  }

  showScreen('screen-home');

  // ---- Event listeners ----

  // Home → Canvas
  document.getElementById('btn-start').addEventListener('click', () => {
    const prompt = getCurrentPrompt();
    if (prompt) renderCanvasConstraints(prompt);
    resetCanvas();
    showScreen('screen-canvas');
    focusCanvas();
  });

  // Canvas back
  document.getElementById('btn-back-canvas').addEventListener('click', () => {
    showScreen('screen-home');
  });

  // Feedback back
  document.getElementById('btn-back-feedback').addEventListener('click', () => {
    showScreen('screen-canvas');
  });

  // Canvas submit → Feedback
  initCanvas(handleSubmit);

  // Retry on error
  document.getElementById('btn-retry').addEventListener('click', () => {
    if (lastUserText) handleSubmit(lastUserText);
  });

  // Done button — increment streak, go home
  document.getElementById('btn-done').addEventListener('click', () => {
    incrementStreak();
    document.getElementById('streak-count').textContent = getStreak();
    showScreen('screen-home');
  });

  // Bottom sheet
  initBottomSheet();
}

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', () => {
  if (checkApiKey()) {
    init();
  }
});
