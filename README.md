# Auctionary — Trading Card Auctions

A full-stack auction platform built for the **Full-Stack Web Development**
unit (1CWK100). The back end is a Node.js/Express REST API with a SQLite
database; the front end is a Vue 3 single-page application. This deployment is
themed for anime trading cards, so the interface uses a light pink-and-white
palette with rarity badges and card-style components.

```
Browser (Vue 3 + Vite)
        │  JSON over HTTP
        ▼
Express API  →  routes  →  controllers (Joi validation)
        │                 └→ models (SQLite queries)
        ▼
     db.sqlite
```

## Contents

| Path | Description |
|---|---|
| `backend/` | Node.js + Express API, organised with the MVC pattern (routes / controllers / models) |
| `frontend/` | Vue 3 application with Vue Router, a service layer and component-based pages |
| `Demonstration.mp4` | Five-minute English walkthrough of the running site, its features and the code |
| `README.md` | This file |

Dependencies (`node_modules`) and the database file (`db.sqlite`) are **not**
included: dependencies are installed with `npm install`, and the database is
created automatically on the first run.

## Requirements

- Node.js 20.19 or newer
- npm (installed with Node.js)

## Quick start

Back end — http://localhost:3333:

    cd backend
    npm install
    npm run dev

Front end — http://localhost:5173, in a second terminal:

    cd frontend
    npm install
    npm run dev

The first start of the back end creates `db.sqlite` and all of its tables, so
the site opens with an empty catalogue. That is expected: the database is a
runtime artifact, not part of the submitted source.

## Demo data (optional)

For the screencast the database is populated with a prepared catalogue:
47 card listings (three of them already ended), six users, bid histories and
nine preset questions (five answered, four waiting).

    cd backend
    node demo.js

`demo.js` seeds an empty database and then starts the server. Alternatively,
with the server already running:

    cd backend
    node seed-cards.js

`seed-cards.js` always resets the tables first, so it is safe to run repeatedly.

### Demo accounts

All accounts use the password **`Password123!`**.

| Account | Name | Role |
|---|---|---|
| `wang@example.com` | Wang | main seller (32 listings) |
| `li@example.com` | Li | second seller (11 listings) |
| `sun.jiaqi@example.com` | Sun Jiaqi | third seller (4 listings) |
| `zhang@example.com` | Zhang | bidder (9 bids) |
| `chen@example.com` | Chen | bidder (9 bids) |
| `zhou@example.com` | Zhou | bidder (12 bids) |

## Features

**Users**

- Register with client-side and server-side validation (Joi), login, logout
- Passwords hashed with PBKDF2 and a random salt; session tokens stored in the
  users table and checked through the `X-Authorization` middleware (401)
- Profile with the user's selling, bidding-on and ended auctions

**Auctions**

- Create a listing with title, description, starting bid, end date, an optional
  photo (resized in the browser) and one or more categories
- Search by keyword, category and status (`OPEN`, `BID`, `ARCHIVE`) with
  `limit` / `offset` pagination
- Item detail page with current bid, bid history and questions/answers
- Bidding rules enforced on the server: no bids on your own item (403), bids
  must exceed the current highest bid (400), missing item (404)
- Questions: buyers may ask; only the item's seller may answer (403 otherwise)

**Extension tasks**

1. **Profanity filter** — items, questions, answers and category names are
   checked with the `bad-words` library before they are written; a hit returns
   400.
2. **Categories** — `categories` and a many-to-many `item_categories` table,
   `GET`/`POST /categories`, multiple categories per item and a `category_id`
   search filter.
3. **Drafts** — unfinished listings are saved in `localStorage` and can be
   listed, edited, published or deleted from the Drafts page.

## API summary

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/users` | no |
| GET | `/users/:user_id` | no |
| POST | `/login` | no |
| POST | `/logout` | yes |
| POST | `/item` | yes |
| GET | `/item/:item_id` | no |
| GET / POST | `/item/:item_id/bid` | GET no / POST yes |
| GET | `/search` | `status` requires a token |
| GET / POST | `/item/:item_id/question` | GET no / POST yes |
| POST | `/question/:question_id` | yes |
| GET / POST | `/categories` | GET no / POST yes |

## Tests

The supplied test scripts connect to the running server on port 3333 and assume
a **fresh** database, so wipe before each run:

    # terminal 1
    cd backend
    npm run dev

    # terminal 2
    cd backend
    npm run wipe
    npm test

Result: **128 passing**.

## Technical notes

- **MVC back end** — `app/routes` defines the endpoints, `app/controllers`
  handles Joi validation and HTTP status codes, `app/models` contains the SQLite
  queries. All SQL uses parameterised statements.
- **Authentication** — passwords are hashed with `crypto.pbkdf2Sync` and a
  random salt; login returns a session token that is stored in the users table
  and required by protected routes through `app/lib/authentication.js`.
- **Front end** — Vue 3 with the Options API, split into `views/pages`,
  `views/components`, `router` and `services`; the service layer wraps `fetch`
  in Promises and centralises HTTP status handling.
- **State** — the session token and user id live in `localStorage`; drafts use
  the same storage via `services/draft.service.js`.
- **Quality** — ESLint, Oxlint and Prettier are configured; the front end builds
  with Vite and the back end is covered by the supplied Mocha/Chai suites.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| All tests fail with `ECONNREFUSED` | The back end is not running — start `npm run dev` in `backend/` first. |
| Tests fail with 400s or wrong counts | The database was not wiped — run `npm run wipe` before `npm test`. |
| `EADDRINUSE :::3333` | Another back end is already using the port — stop it first. |
| Front end opens on 5174 | Port 5173 is taken; stop the other Vite process or keep using 5174. |
| Empty catalogue | Expected on a fresh database — load the demo data with `node demo.js`. |
