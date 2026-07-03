# WordForge

A daily vocabulary training app for three age tiers, built as a 6-week intensive summer course:

- **9-12** — targeting 11+ entrance exam vocabulary
- **12-18** — targeting GCSE / A-level vocabulary
- **18+** — targeting advanced literature vocabulary

## Features

- Accounts with persistent progress (email/password login, one age tier per account)
- **Daily 15** — flashcards with definitions, synonyms, antonyms, and an example sentence; one new set unlocks per calendar day
- **Quiz** — cumulative multiple-choice testing, pulling from every word a learner has seen so far via a 5-box Leitner spaced-repetition schedule
- **Sentence practice** — write a sentence using a target word, with instant rule-based feedback
- **Paragraph challenge** — weave a whole day's 15 words into a paragraph, with per-word usage feedback
- Duolingo-style points (XP), levels, and day streaks

## Content status

Each tier currently ships with **2 weeks of curated content (Day 1–7 seeded so far, 105 words per tier)**. The data files (`data/words/*.json`) are structured to hold the full 6-week / 42-day course — additional days can be appended without any code changes. When a learner reaches the last available day, the app tells them more is coming rather than failing.

## Grading is rule-based, not AI-graded

Sentence and paragraph practice use simple rule-based checks (does the submission use the target word, is it long enough, etc.) — not true AI writing feedback. This is called out in the app's own copy. Wiring in real AI grading would require a Claude API key.

## Running locally

```
npm install
node server.js        # defaults to port 8023
```

Then open http://localhost:8023.

## Stack

- Backend: Node.js + Express, `node:sqlite` for storage, JWT-in-httpOnly-cookie sessions
- Frontend: vanilla JS SPA (ES modules, hash router), no build step
