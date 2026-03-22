#  ⚡QuizMind AI

> A personalized quiz app powered by AI. Chat with the bot, tell it your interests, and get a custom quiz generated just for you — instantly.

---

## 📁 What's Inside

```
quizmind/
├── index.html   → The app interface (open this in your browser)
├── style.css    → Visual design & animations
├── app.js       → App logic (chat, quiz, scoring)
├── server.py    → Python server (connects to the AI)
└── README.md    → This file
```

---

## 🚀 Getting Started

### Step 1 — Make sure Python is installed

Open a terminal and run:
```bash
python --version
```
You need **Python 3.8 or higher**. If you don't have it, download it from [python.org](https://www.python.org/downloads/).

---

### Step 2 — Install the required packages

In your terminal, run this command from inside the project folder:
```bash
pip install flask flask-cors anthropic
```

---

### Step3 — Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create a free account
3. Navigat e to **API Keys** and create a new key
4. Copy the key (it looks like `sk-ant-...`)

---

### Step 4 — Add your API key

Open `server.py` in any text editor and find this line near the top:

```python
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "your-api-key-here")
```

Replace `your-api-key-here` with your actual key:

```python
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "sk-ant-xxxxxxxxxxxx")
```

Save the file.

> 💡 **Keep your key private** — don't share `server.py` publicly with your key inside it.

---

### Step 5 — Start the server

In your terminal, navigate to the project folder and run:

```bash
python server.py
```

You should see:
```
==================================================
  QuizMind AI — Flask server
  http://localhost:5000
==================================================
```

---

### Step 6 — Open the app

Open your browser and go to:

**👉 http://localhost:5000**

That's it — the app is running!

---

## 🎮 How to Use the App

### 1. Chat with the AI
When the app opens, the AI assistant will greet you on the **left panel**. Type in the chat box and press **Enter** (or click the send button).

### 2. Tell it your interests
The bot will ask what topics you want to be quizzed on. You can say things like:
- *"I like science and history"*
- *"Quiz me on football and music"*
- *"Technology and movies please"*

Supported topics include: **Tech, Science, History, Sports, Movies, Music, Geography, Math**, and many more.

### 3. Your quiz is generated
Once the bot detects your interests, it will automatically generate a **5-question quiz** tailored to those topics. You'll see it appear on the **right panel**.

### 4. Answer the questions
Click on one of the 4 answer options. The app will immediately tell you if you were right or wrong, and explain the correct answer.

### 5. See your results
After question 5, you'll get a results screen showing your score out of 5. From there you can:
- **Retry** — play the same topics again with different questions
- **Change Interests** — go back to the chat and pick new topics

---

## 🌐 Supported Quiz Topics

| Topic | Examples you can say |
|-------|----------------------|
| Technology | "tech", "programming", "coding" |
| Science | "science", "physics", "chemistry" |
| History | "history" |
| Sports | "sports", "football", "basketball" |
| Movies | "movies", "cinema", "film" |
| Music | "music" |
| And more | Geography, Math, Literature, Space… |

---

## ❓ Troubleshooting

**The page won't load**
Make sure the server is running (`python server.py`) and visit `http://localhost:5000`, not just `index.html`.

**"Connection issue" error in the chat**
Check that your API key is correctly pasted in `server.py` and that the server is still running in your terminal.

**Quiz doesn't generate**
Try being more specific with your interests. Instead of "stuff", say "science and movies".

**Port already in use**
Something else is using port 5000. Open `server.py` and change the last line:
```python
app.run(debug=True, port=5001)   # change 5000 to any other number
```
Then visit `http://localhost:5001`.

---

## 🛑 Stopping the App

Go back to your terminal and press **Ctrl + C** to stop the server.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Python 3, Flask |
| AI | Anthropic Claude API |
| Fonts | Syne, DM Mono (Google Fonts) |

---

Made with ⚡ and a lot of curiosity.
