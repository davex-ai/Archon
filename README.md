# 🚀 ARCHON
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,100:8b5cf6&height=200&section=header&text=Repo%20Interview%20Generator&fontSize=40&fontColor=ffffff" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Language-Python-3776AB?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-RAG%20Pipeline-8b5cf6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Embeddings-SentenceTransformers-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=20&pause=1000&color=8B5CF6&center=true&vCenter=true&width=600&lines=Analyze+Any+GitHub+Repo;Generate+Deep+Interview+Questions;Fallback+AI+Without+LLMs;Built+for+Real+Engineering+Insight" />
</p>

---

## 🧠 What is this?

A system that **analyzes any GitHub repository** and generates **deep technical interview questions + answers** based on:

* Architecture
* Scalability
* Tradeoffs
* Real-world engineering decisions

⚡ Works even without LLM access using a **fallback heuristic engine**.

---

## ✨ Features

### 🔍 Repository Analysis

* Fetches and parses GitHub repositories via API
* Prioritizes important files (core logic > boilerplate)
* Supports multiple languages

### 🧩 Intelligent Chunking

* Breaks code into meaningful chunks
* Filters noise (non-informative code)
* Preserves structural context

### 🧠 Embedding + Retrieval (RAG)

* Uses **SentenceTransformers**
* Retrieves most relevant code sections
* Builds contextual understanding of system design

### 🤖 AI Question Generation

* Generates interview-level questions on:

  * Architecture decisions
  * Scalability concerns
  * Tradeoffs

### ⚡ Fallback Mode (No LLM Required)

* Automatically switches to **rule-based generation**
* Uses detected signals:

  * API usage
  * State management
  * Auth systems
  * Async logic

---

## 🧱 System Architecture

```txt
GitHub Repo
   ↓
File Fetching + Prioritization
   ↓
Chunking + Filtering
   ↓
Embeddings (SentenceTransformers)
   ↓
Vector Similarity Retrieval
   ↓
Context Builder
   ↓
AI Question Generator
   ↓
Fallback Engine (if LLM unavailable)
```

---

## 🛠️ Tech Stack

```bash
Backend:
- FastAPI
- Python

AI / ML:
- SentenceTransformers
- Cosine Similarity (Sklearn)

Data:
- GitHub REST API

Frontend:
- Minimal Web UI (React / HTML)

Optional:
- OpenAI API (LLM generation)
```

---

## ⚙️ How it Works

1. Input a GitHub repo URL
2. System fetches and filters key files
3. Code is chunked and embedded
4. Relevant chunks are retrieved
5. Questions are generated using:

   * LLM (if available)
   * OR fallback heuristic engine

---

## 📡 API Usage

### POST `/analyze`

```json
{
  "repo_url": "https://github.com/user/repo",
  "num_questions": 5
}
```

### Response

```json
{
  "repo": "...",
  "mode": "mock",
  "questions": [
    {
      "id": 1,
      "question": "...",
      "answer": "..."
    }
  ]
}
```

---

## ⚠️ Challenges Solved

* Large repo handling (chunking + prioritization)
* Token limitations (retrieval instead of full context)
* LLM dependency → solved with fallback system
* Noise reduction in code analysis

---

## 💡 Future Improvements

* 🔥 Dynamic repo-type detection (ML, backend, real-time, etc.)
* 📊 Question difficulty levels (junior → senior)
* 🔗 Follow-up interview questions
* 🧠 Hybrid LLM + rule-based reasoning
* ⚡ Caching + performance optimization

---

## 🧑‍💻 Author

Built by **Dave** — aspiring systems engineer ⚡

---

## 🎬 Demo

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2Z4b2h3YzJ5dTFoMGN6dGx6eTVjYjZ0d2VtZ2w0N2JkNnR3b2p5ZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26tn33aiTi1jkl6H6/giphy.gif" width="500" />
</p>

---

## ⭐ Support

If this project helped or inspired you:

* ⭐ Star the repo
* 🍴 Fork it
* 🧠 Build something even crazier

---

<p align="center">
  <b>“Don’t just read code. Interrogate it.”</b>
</p>
