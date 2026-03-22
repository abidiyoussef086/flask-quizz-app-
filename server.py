"""
QuizMind AI — server.py
========================
This file is the ENTRY POINT. Run it with:  python server.py

HOW THE FILES ARE LINKED
─────────────────────────────────────────────────────
  server.py          serves ──▶  index.html   (route  GET  /)
  server.py          serves ──▶  style.css    (route  GET  /style.css)
  server.py          serves ──▶  app.js       (route  GET  /app.js)

  index.html         loads  ──▶  style.css    (<link rel="stylesheet" href="style.css">)
  index.html         loads  ──▶  app.js       (<script src="app.js"></script>)

  app.js    calls API ──▶  /api/chat          (route  POST /api/chat)
  app.js    calls API ──▶  /api/quiz          (route  POST /api/quiz)

  /api/chat  & /api/quiz   call ──▶  Anthropic Claude API  (key stays here, never in browser)
─────────────────────────────────────────────────────

Install dependencies:
    pip install flask flask-cors anthropic

Set your API key (choose one method):
    Option A — environment variable (recommended):
        export ANTHROPIC_API_KEY="sk-ant-..."
    Option B — paste it below in ANTHROPIC_API_KEY

Run:
    python server.py
Open:
    http://localhost:5000
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic

# ── CONFIG ────────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "your-api-key-here")
MODEL             = "claude-opus-4-5"
MAX_TOKENS        = 1024

# ── PROMPTS ───────────────────────────────────────────────────────────────────

CHAT_SYSTEM_PROMPT = """You are QuizMind, a friendly and enthusiastic AI quiz companion.

Your job:
1. Greet the user warmly when they first arrive.
2. Ask them what topics they're interested in for a quiz
   (e.g. tech, science, history, sports, movies, music, geography, math…).
3. Once you've identified their interests (1–3 topics), end your message with
   this EXACT signal on its own line:

   INTERESTS_DETECTED: topic1, topic2, topic3

Keep responses short (2–4 sentences), energetic, and encouraging.
Be conversational, not robotic.
If the user is unclear, gently guide them back to picking quiz topics."""

QUIZ_SYSTEM_PROMPT = """You are a quiz generator.
Generate exactly 5 multiple-choice questions about the given topics.

Return ONLY valid JSON — no markdown fences, no extra text. Format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}

Rules:
- "correct" is the 0-based index of the correct option.
- Mix topics if multiple interests are given.
- Questions should be interesting, not trivial.
- All four options should be plausible.
- Keep questions clear and concise."""

# ── FLASK APP ─────────────────────────────────────────────────────────────────

app    = Flask(__name__)
CORS(app)
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# ── STATIC FILE ROUTES ────────────────────────────────────────────────────────
# Explicitly serve each frontend file so Flask knows exactly where each one is.

@app.route("/")
def serve_index():
    """Serve index.html — the main app page."""
    return send_from_directory(".", "index.html")

@app.route("/style.css")
def serve_css():
    """Serve style.css — loaded by index.html via <link rel='stylesheet'>."""
    return send_from_directory(".", "style.css")

@app.route("/app.js")
def serve_js():
    """Serve app.js — loaded by index.html via <script src='app.js'>."""
    return send_from_directory(".", "app.js")

# ── API ROUTES ────────────────────────────────────────────────────────────────
# Called by app.js using fetch('/api/chat') and fetch('/api/quiz').

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """
    Receive conversation history from app.js, send to Claude, return reply.

    Request body:  { "messages": [ {"role": "user"|"assistant", "content": "..."} ] }
    Response body: { "reply": "..." }
    """
    data     = request.get_json(force=True)
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=CHAT_SYSTEM_PROMPT,
            messages=messages,
        )
        return jsonify({"reply": response.content[0].text})

    except anthropic.APIError as e:
        print(f"[Anthropic error] {e}")
        return jsonify({"error": str(e)}), 502


@app.route("/api/quiz", methods=["POST"])
def api_quiz():
    """
    Receive interests list from app.js, generate a quiz with Claude, return questions.

    Request body:  { "interests": ["tech", "history", ...] }
    Response body: { "questions": [ { question, options, correct, explanation } ] }
    """
    data      = request.get_json(force=True)
    interests = data.get("interests", [])

    if not interests:
        return jsonify({"error": "No interests provided"}), 400

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=QUIZ_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Generate a quiz about: {', '.join(interests)}"}],
        )
        raw       = response.content[0].text.strip()
        raw       = raw.replace("```json", "").replace("```", "").strip()
        questions = json.loads(raw).get("questions", [])
        return jsonify({"questions": questions})

    except json.JSONDecodeError as e:
        print(f"[JSON parse error] {e}")
        return jsonify({"error": "Failed to parse quiz JSON from Claude"}), 500

    except anthropic.APIError as e:
        print(f"[Anthropic error] {e}")
        return jsonify({"error": str(e)}), 502


# ── START ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 52)
    print("  QuizMind AI — server running")
    print("  Open ▶  http://localhost:5000")
    print("=" * 52)
    app.run(debug=True, port=5000)
