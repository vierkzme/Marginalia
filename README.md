# Marginalia: Contextual Reading & Idiom Vault

> A distraction-free contextual reader and sentence-mining vault powered by spaCy NLP and SuperMemo-2 spaced repetition.

**Marginalia** is a distraction-free web reader and vocabulary acquisition platform designed around the **Sentence Mining** methodology: capturing words, idioms, and phrasal verbs directly from authentic texts, paired with the mathematical precision of the **SuperMemo-2 (SM-2)** spaced repetition algorithm.

Unlike traditional flashcard applications that force vocabulary memorization in isolation, Marginalia permanently anchors every word or idiom to the exact sentence where you first encountered it. This ensures you master real-world usage, grammatical collocations, and contextual nuance.

---

## Key Features

### 1. Distraction-Free Web Reader & Multi-Source Importer
* **Multiple Input Sources:** Import reading material via raw text pasting, automated webpage extraction through Mozilla Readability, or subtitle uploads (`.txt` and `.srt` with automated timestamp stripping).
* **Pre-Reading Lexical Coverage:** Evaluates reading difficulty before you begin by comparing text tokens against your personal vault ($<85\%$ Challenging, $85\text{–}95\%$ Optimal Comprehensible Input, $>95\%$ Fluency Practice).
* **Editorial Typography:** Designed with a 65-character measure, adjustable type scale, and three ambient reading themes (Light Paper, Warm Sepia, and Dark Ink).

### 2. One-Click Sentence Mining
* **Instant Native Selection:** Select any unfamiliar word or multi-word expression in the reader to trigger the mining popover via the browser Selection API (`window.getSelection()`).
* **Automated Context Extraction:** Uses Sentence Boundary Detection (SBD) to instantly isolate and store the complete surrounding sentence alongside the vocabulary item.
* **Hybrid Definition & Tagging:** Fetches immediate dictionary definitions while allowing personal translation notes and categorizing tags (`Idiom`, `Phrasal Verb`, `Academic`, `Slang`).

### 3. spaCy Lemmatization & Dual-Color Smart Highlighting
* **Morphological Lemma Matching:** Automatically connects inflected verb tenses and plural forms back to their base lemma (for example, *"ran into"* and *"running into"* map to `"run into"`).
* **Dual-Color Highlighting:**
  * **Yellow (Learning):** Active vocabulary currently progressing through your review queue.
  * **Soft Rose (Leech):** High-lapse items requiring focused review attention.
  * **Neutral (Mastered):** Fully internalized words rendered without visual distraction.

### 4. Cloze Deletion Review Deck with Multi-Context Hints
* **Contextual Active Recall:** Reviews present original sentences with the target phrase masked (`[ • • • • • • • ]`), encouraging natural retrieval from memory.
* **Multi-Context Hint (`H` key):** If an item has been mined across multiple articles, cycle through alternate context sentences without revealing the answer.
* **Progressive Letter Hint (`L` key):** Uncovers the initial letters of each word in the target expression (for example, `b___ t__ b_____`).

### 5. SuperMemo-2 (SM-2) Spaced Repetition Scheduling
Marginalia schedules upcoming reviews using pure SuperMemo-2 calculations with 4-button grading: **Again (1)**, **Hard (2)**, **Good (3)**, and **Easy (4)**.

$$\text{Interval Calculation: } I_1 = 1, \quad I_2 = 6, \quad I_n = \text{round}(I_{n-1} \times EF)$$

$$\text{Easiness Factor Update: } EF' = \max\left(1.3,\; EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))\right)$$

Automated lapse tracking flags any card failing four or more times ($\ge 4$ lapses) as a **Leech**, adjusting reader highlights and adding the card to the dashboard watchlist.

### 6. Mastery Analytics Dashboard
* **365-Day Contribution Heatmap:** Visualizes daily reading and review habits inspired by GitHub contribution activity.
* **Retention Distribution (Recharts):** Tracks vocabulary maturation across **New**, **Learning** ($< 7\text{ days}$), **Young** ($7\text{–}21\text{ days}$), and **Mature** ($> 21\text{ days}$).
* **Leech Watchlist:** Surfaces problematic vocabulary requiring alternative context sentences or mnemonic assistance.

---

## System Architecture

Marginalia is built as a polyglot monorepo separating editorial presentation, scheduling logic, and deep natural language processing:

```
marginalia/
├── apps/
│   ├── web/           # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── api/           # Node.js + Express + TypeScript + Prisma ORM
│   └── nlp-service/   # Python 3.11 + FastAPI + spaCy (en_core_web_sm)
├── docker-compose.yml # Container orchestration for all microservices
└── README.md          # Public documentation
```

### Technology Stack

| Layer | Technologies | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Distraction-free reader, text selection hooks, and interactive cloze review deck. |
| **Data Visualization** | Recharts | Retention distribution graphs, mastery progress, and lapse statistics. |
| **Core Backend** | Node.js, Express, TypeScript, Prisma ORM | RESTful endpoints, JWT authentication, and mathematical SM-2 scheduling. |
| **Dual-Mode Persistence** | PostgreSQL & In-Memory Store | Production PostgreSQL support with instant zero-configuration in-memory fallback. |
| **NLP Microservice** | Python 3.11, FastAPI, spaCy | Sentence Boundary Detection (SBD), multi-word lemmatization, and `.srt` cleaning. |
| **Testing** | Jest, React Testing Library, Pytest | Test suites for SM-2 interval formulas, NLP pipelines, and interactive UI components. |
| **DevOps** | Docker, Docker Compose | Multi-stage production container builds and local service orchestration. |

---

## Getting Started

### Option A: Local Development (Instant, Zero Setup)

Marginalia includes a **Dual-Mode Persistence Store**, allowing you to run the frontend and backend immediately without starting PostgreSQL:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vierkzme/Marginalia.git
   cd Marginalia
   ```

2. **Run Core API:**
   ```bash
   cd apps/api
   npm install
   npm run dev
   # API listening at http://localhost:4000
   ```

3. **Run Web Frontend (in a separate terminal):**
   ```bash
   cd apps/web
   npm install
   npm run dev
   # Web application running at http://localhost:5173
   ```

4. **(Optional) Run NLP Microservice:**
   ```bash
   cd apps/nlp-service
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   uvicorn app.main:app --reload --port 8000
   ```

### Option B: Docker Compose (Full Containerized Stack)

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and launch all services
docker compose up --build
```

* **Web Frontend:** `http://localhost:5173`
* **Core REST API:** `http://localhost:4000/api/v1`
* **NLP Service:** `http://localhost:8000/nlp/v1`

---

## Test Suites

```bash
# Frontend component & keyboard shortcut tests
npm --prefix apps/web test

# Backend SM-2 engine & cloze generator tests
npm --prefix apps/api test
```

---

## Author & License

Developed and maintained by **Ardy Nugroho** ([@vierkzme](https://github.com/vierkzme)).

This project is licensed under the terms of the MIT License. See the [LICENSE](./LICENSE) file for complete details.
