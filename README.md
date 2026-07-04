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

The full 6-week course is complete: **42 days × 15 words per tier = 630 words per tier, 1,890 curated words in total** across `data/words/*.json`. Every entry has a definition, part of speech, synonyms, antonyms, and an example sentence, pitched at the tier's target level (11+ / GCSE-A-level / advanced literature).

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
