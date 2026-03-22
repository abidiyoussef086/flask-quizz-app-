/* ══════════════════════════════════════════════════════════
   QuizMind AI — app.js

   FILE LINKS FROM app.js
   ══════════════════════════════════════════════════════════
   Loaded by  ← index.html  via  <script src="app.js">
   Styled by  ← style.css   (classes used: .message, .tag,
                              .option-btn, .feedback-bar…)
   Calls API  → POST /api/chat   (handled by server.py)
   Calls API  → POST /api/quiz   (handled by server.py)
   ══════════════════════════════════════════════════════════ */

// ── STATE ────────────────────────────────
let conversationHistory = [];
let currentInterests    = [];
let quizQuestions       = [];
let currentQ            = 0;
let score               = 0;
let answered            = false;

const LETTERS = ['A', 'B', 'C', 'D'];

// ── API HELPERS ──────────────────────────

/**
 * Send a chat message to the Flask backend.
 * Returns the assistant reply string.
 */
async function apiChat(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return data.reply;
}

/**
 * Ask the Flask backend to generate a quiz for the given interests.
 * Returns an array of question objects.
 */
async function apiGenerateQuiz(interests) {
  const res = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests })
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  return data.questions;
}

// ── CHAT UI ──────────────────────────────

function addMessage(role, text) {
  const container = document.getElementById('chatMessages');
  const msg       = document.createElement('div');
  msg.className   = `message ${role}`;

  const label       = document.createElement('div');
  label.className   = 'msg-label';
  label.textContent = role === 'bot' ? 'QuizMind AI' : 'You';

  const bubble       = document.createElement('div');
  bubble.className   = 'msg-bubble';
  // Strip the INTERESTS_DETECTED signal from visible text
  bubble.textContent = text.replace(/INTERESTS_DETECTED:.*$/m, '').trim();

  msg.appendChild(label);
  msg.appendChild(bubble);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container  = document.getElementById('chatMessages');
  const indicator  = document.createElement('div');
  indicator.className = 'message bot';
  indicator.id        = 'typingIndicator';
  indicator.innerHTML = `
    <div class="msg-label">QuizMind AI</div>
    <div class="msg-bubble typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function setInputEnabled(enabled) {
  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('sendBtn');
  input.disabled = !enabled;
  btn.disabled   = !enabled;
  if (enabled) input.focus();
}

// ── SEND MESSAGE ─────────────────────────

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;

  input.value       = '';
  input.style.height = 'auto';
  setInputEnabled(false);
  addMessage('user', text);

  conversationHistory.push({ role: 'user', content: text });

  showTyping();
  try {
    const reply = await apiChat(conversationHistory);
    hideTyping();
    addMessage('bot', reply);
    conversationHistory.push({ role: 'assistant', content: reply });

    // Did the bot detect interests?
    const match = reply.match(/INTERESTS_DETECTED:\s*(.+)/i);
    if (match) {
      const interests = match[1].split(',').map(s => s.trim()).filter(Boolean);
      if (interests.length > 0) {
        currentInterests = interests;
        showInterestTags(interests);
        setInputEnabled(false);
        setTimeout(() => generateQuiz(interests), 1200);
        return;
      }
    }
  } catch (err) {
    hideTyping();
    addMessage('bot', 'Sorry, I had a connection issue. Is the server running?');
    console.error(err);
  }

  setInputEnabled(true);
}

// ── INTEREST TAGS ────────────────────────

const TAG_CLASSES = {
  tech: 'tag-tech',    technology: 'tag-tech',   programming: 'tag-tech',
  science: 'tag-science', physics: 'tag-science', chemistry: 'tag-science',
  history: 'tag-history',
  sports: 'tag-sports',  football: 'tag-sports',  basketball: 'tag-sports',
  movies: 'tag-movies',  cinema: 'tag-movies',    film: 'tag-movies',
  music: 'tag-music',
};

function showInterestTags(interests) {
  const container = document.getElementById('interestTags');
  container.innerHTML = '';
  interests.forEach((interest, i) => {
    const tag       = document.createElement('div');
    const cls       = TAG_CLASSES[interest.toLowerCase()] || 'tag-default';
    tag.className   = `tag ${cls}`;
    tag.textContent = `#${interest}`;
    tag.style.animationDelay = `${i * 0.1}s`;
    container.appendChild(tag);
  });
}

// ── QUIZ GENERATION ──────────────────────

async function generateQuiz(interests) {
  document.getElementById('quizIdle').classList.add('hidden');
  document.getElementById('quizLoading').classList.remove('hidden');

  try {
    quizQuestions = await apiGenerateQuiz(interests);
    currentQ = 0;
    score    = 0;

    document.getElementById('quizLoading').classList.add('hidden');
    document.getElementById('quizActive').classList.remove('hidden');
    document.getElementById('quizTopic').textContent  = interests.map(i => `#${i}`).join(' · ').toUpperCase();
    document.getElementById('scoreNum').textContent   = '0';
    renderQuestion();
  } catch (err) {
    document.getElementById('quizLoading').classList.add('hidden');
    document.getElementById('quizIdle').classList.remove('hidden');
    addMessage('bot', "Hmm, I couldn't generate the quiz. Could you try picking your topics again?");
    setInputEnabled(true);
    console.error(err);
  }
}

// ── RENDER QUESTION ──────────────────────

function renderQuestion() {
  const q     = quizQuestions[currentQ];
  const total = quizQuestions.length;
  answered    = false;

  document.getElementById('progressLabel').textContent = `Question ${currentQ + 1} / ${total}`;
  document.getElementById('questionNum').textContent   = `Q ${String(currentQ + 1).padStart(2, '0')}`;
  document.getElementById('questionText').textContent  = q.question;
  document.getElementById('progressFill').style.width  = `${(currentQ / total) * 100}%`;

  const grid = document.getElementById('optionsGrid');
  grid.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.setAttribute('data-letter', LETTERS[i]);
    btn.setAttribute('data-index', i);
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(i);
    grid.appendChild(btn);
  });

  const fb    = document.getElementById('feedbackBar');
  fb.className    = 'feedback-bar';
  fb.style.display = 'none';
  fb.textContent  = '';

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.style.display = 'none';
}

// ── HANDLE ANSWER ────────────────────────

function handleAnswer(selected) {
  if (answered) return;
  answered = true;

  const q       = quizQuestions[currentQ];
  const correct = q.correct;
  const buttons = document.querySelectorAll('.option-btn');
  const fb      = document.getElementById('feedbackBar');
  const nextBtn = document.getElementById('nextBtn');

  buttons.forEach(btn => {
    btn.disabled = true;
    const idx = parseInt(btn.getAttribute('data-index'));
    if (idx === correct)                     btn.classList.add('correct');
    else if (idx === selected)               btn.classList.add('wrong');
  });

  if (selected === correct) {
    score++;
    document.getElementById('scoreNum').textContent = score;
    fb.className = 'feedback-bar correct-fb';
    fb.innerHTML = `✅ Correct! ${q.explanation}`;
  } else {
    fb.className = 'feedback-bar wrong-fb';
    fb.innerHTML = `❌ Not quite. ${q.explanation}`;
  }

  nextBtn.style.display = 'flex';
  nextBtn.textContent   = currentQ === quizQuestions.length - 1 ? 'See Results →' : 'Next →';
}

// ── NEXT / RESULTS ───────────────────────

function nextQuestion() {
  currentQ++;
  if (currentQ >= quizQuestions.length) showResults();
  else renderQuestion();
}

function showResults() {
  document.getElementById('quizActive').classList.add('hidden');
  document.getElementById('quizResults').classList.remove('hidden');

  const total = quizQuestions.length;
  const pct   = Math.round((score / total) * 100);

  document.getElementById('resultScore').textContent = score;
  document.getElementById('resultTotal').textContent = `/ ${total}`;
  document.getElementById('resultCircle').style.setProperty('--pct', `${pct}%`);

  const ratings = [
    [100, '🏆 Perfect Score!',  "You're a genius. Truly unstoppable."],
    [80,  '🔥 Excellent!',       "You really know your stuff. Impressive!"],
    [60,  '👍 Good Job!',        "Solid effort! A bit more practice and you'll nail it."],
    [40,  '📚 Keep Going!',      "Not bad for a start. Retry to improve!"],
    [0,   '💪 Try Again!',       "Everyone starts somewhere. Give it another shot!"],
  ];

  const [, title, sub] = ratings.find(([min]) => pct >= min);
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultSub').textContent   = sub;

  const comment = pct >= 60
    ? `You scored ${score}/${total} — ${pct}%! 🎉 Great work on the ${currentInterests.join(' & ')} quiz!`
    : `You got ${score}/${total} this time. Want to retry or explore a different topic? 😊`;
  addMessage('bot', comment);
}

function retryQuiz() {
  document.getElementById('quizResults').classList.add('hidden');
  generateQuiz(currentInterests);
}

function changeInterests() {
  document.getElementById('quizResults').classList.add('hidden');
  document.getElementById('quizIdle').classList.remove('hidden');
  document.getElementById('interestTags').innerHTML = '';
  conversationHistory = [];
  addMessage('bot', "Sure! Tell me what new topics you'd like to explore 🎯");
  setInputEnabled(true);
}

// ── TEXTAREA AUTO-RESIZE ─────────────────

document.getElementById('chatInput').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

document.getElementById('chatInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!this.disabled) sendMessage();
  }
});

// ── INIT ─────────────────────────────────

async function init() {
  showTyping();
  try {
    const greeting = await apiChat([
      { role: 'user', content: 'Hello! I just opened the quiz app.' }
    ]);
    hideTyping();
    addMessage('bot', greeting);
    conversationHistory.push({ role: 'assistant', content: greeting });
    setInputEnabled(true);
  } catch {
    hideTyping();
    addMessage('bot', "Hi! Welcome to QuizMind AI! 🎉 What topics would you like to be quizzed on today?");
    setInputEnabled(true);
  }
}

init();
