# Glossia

A language-learning app: a guided A1–A2 learning path, flashcards, a translator
and saved favorites, in 8 languages (EN, ES, FR, DE, IT, PT, RU, ZH).

**Live:** <https://glossia-v2.onrender.com> — hosted on Render's free tier, so
the first load can take up to a minute while the server wakes up.

[![Glossia — sign-in screen](docs/screenshot.jpg)](https://glossia-v2.onrender.com)

## Features

- **Learning path** — A1 and A2 units with lessons that unlock in order
- **Flashcards** by category, with progress tracking
- **Translator** powered by the [MyMemory](https://mymemory.translated.net) API
- **Favorites** — save words and phrases to review later
- **Accounts** with email/password or Google sign-in

## Stack

| Layer | Tech |
| --- | --- |
| Frontend (`client/`) | React 19, React Router, Vite, Axios |
| Backend (`server/`) | Node.js, Express 5, express-validator |
| Database | MySQL (`mysql2`), SQL migrations |
| Auth | JWT in an httpOnly cookie, bcrypt, Passport (Google OAuth 2.0) |
| Security | helmet, express-rate-limit |
| Deploy | Render |

## Setup

```bash
# 1. API
cd server
cp .env.example .env       # fill in DB credentials and generate the secrets
npm install
npm run migrate            # creates/updates the schema and seeds flashcards
npm run dev                # http://localhost:3000

# 2. Client (another terminal)
cd client
npm install
npm run dev                # http://localhost:5173
```

Google sign-in is optional: set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and
register `http://localhost:3000/api/auth/google/callback` as a redirect URI.

## How it fits together

| Area | Where |
| --- | --- |
| Learning path content (A1/A2, every language) | `server/src/data/curriculum.js` |
| Path order, unlocking, lesson ids | `server/src/services/curriculumService.js` |
| Exercise generation & answer checking | `client/src/lib/exercises.js` |
| Database migrations | `server/db/migrations/*.sql` (`npm run migrate`) |
| Supported languages | `server/src/config/languages.js` + `client/src/lib/languages.js` (keep in sync) |

### Auth & security

- Sessions are a JWT in an **httpOnly, SameSite=Lax cookie** (not localStorage),
  so scripts on the page can't read it.
- Passwords: bcrypt (12 rounds), min 8 chars with a letter and a number.
- Rate limits on login/register and on the whole API; security headers via helmet.
  Limits are counted per client IP, so in production `TRUST_PROXY_HOPS` must
  match the number of proxies in front of the app — **3 on Render**. To check
  it, the `pk` in the `RateLimit-Policy` header must equal the base64 of the
  first 12 hex chars of `sha256(your IP)`, and must not change when you send a
  fake `X-Forwarded-For`.
- Google OAuth uses the `state` parameter (kept in a short-lived cookie) and never puts tokens in URLs.
- The API refuses to start without `JWT_SECRET`.

### Adding a lesson

Add an entry to a unit's `lessons` in `curriculum.js` with the word in all 8
languages. The server checks at startup that no level repeats a word in the
same language.

## Author

Built by [Jesus Figueroa](https://jfigueroa.dev) · [GitHub](https://github.com/JKs162426)
