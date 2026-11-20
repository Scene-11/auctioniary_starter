# Auctionary Starter Code

**For the full-stack web development assignment 26/27**

Steps to download and run:
1. Make sure you have NodeJS installed on your machine ([Download NodeJS](https://nodejs.org/en/download/))
2. Make sure you have Git installed on your machine  ([Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)/[Mirror Download for Windows Version](https://gitcode.com/MMJISE/se-software-pool))
2. In your terminal, navigate to the directory where you want to download the project
3. Run `git clone https://gitcode.com/MMJISE/auctionary_starter`
4. Once the project has finished downloading, navigate into the projects root directory `cd auctionary_starter`
5. Run `npm install` to install all dependencies for the project
6. Once the dependencies have installed, run the server using `npm run dev`. You will see a message saying that the server is running on port 3333.
7. In a **separate terminal window** navigate to the projects root directory and run `npm run test` to run the tests. The tests will mostly fail, but that is because we have not yet written any code.

Once you have completed the above, you are set up and ready to begin work on the assignment.

**Things to remember:**
1. To re-run the tests, you can first wipe the DB by running `npm run wipe`. The tests assume a fresh database each time.
2. The tests may have mistakes too, check your work manually (using Postman). If you're not sure, ask.
3. The API documentation is located on Swagger [here](https://app.swaggerhub.com/apis/XCUI/Auctionary/1.0.0)

If you have any issues and questions, please let me know.

Xia

---

## Project notes (this submission)

Back-end for the **Auctionary** assignment. Everything below documents the work
that was added on top of the starter project; the instructions above are kept
unchanged.

### Running it

1. `npm install`
2. `npm run dev` — starts the server on port **3333**. On the very first run the
   SQLite database (`db.sqlite`) and all of its tables are created for you.
3. In a second terminal, `npm test` — runs the supplied test scripts.

To start the server **with the demo catalogue already loaded** (47 cards, demo
users, bids and sample Q&A), use:

    node demo.js

That loads the demo data only when the database is still empty, and leaves
`npm run dev` exactly as the starter project expects it.

The database and all of its tables are created automatically on the first run.
Start the server once *before* running `npm run wipe`: the refresh script
deletes rows from tables that it expects to already exist.

> **Before zipping the submission, delete `db.sqlite`.** The marking tests
> assume an empty database, so a database that still contains the demo
> catalogue will make them fail. Re-create the demo data at any time with
> `node seed-cards.js` (handy for recording the screencast).

### Demo data

To fill the empty database with the trading-card catalogue that the front end is
built around (47 Weiss Schwarz cards — three of them already finished, so the
"ended" states can be demonstrated — plus 6 users, categories, bids and preset
Q&A), run:

    node seed-cards.js

The script reads the card faces from `frontend/public/cards` (it also accepts
the original starter folder name); point `CARD_DIR` at another
folder if your images live elsewhere. It prints a check of that folder before it
starts, so any card without a matching image is reported instead of silently
breaking the listing.

All six demo accounts use the password `Password123!`:

| account | name | role |
|---|---|---|
| wang@example.com | Wang | main seller |
| li@example.com | Li | second seller |
| sun.jiaqi@example.com | Sun Jiaqi | third seller, plus bids |
| zhang@example.com | Zhang | bidder |
| chen@example.com | Chen | bidder |
| zhou@example.com | Zhou | bidder |

The seeder also adds nine preset questions: five already answered and four left
waiting, so the seller-answer flow can be demonstrated (items 1, 5 and 14 belong
to Maya; item 9 belongs to Sun and shows the "only the seller can answer" rule).

### Endpoints

| method | route | auth |
|---|---|---|
| POST | `/users` | no |
| GET | `/users/:user_id` | no |
| POST | `/login` | no |
| POST | `/logout` | yes |
| POST | `/item` | yes (accepts an optional `image` data URL) |
| GET | `/item/:item_id` | no |
| GET | `/item/:item_id/bid` | no |
| POST | `/item/:item_id/bid` | yes |
| GET | `/search` (`q`, `status`, `category_id`, `limit`, `offset`) | `status` needs a token |
| GET | `/item/:item_id/question` | no |
| POST | `/item/:item_id/question` | yes |
| POST | `/question/:question_id` | yes |
| GET | `/categories` | no |
| POST | `/categories` | yes |

### Extensions implemented

**Extension 1 — profanity filter (easy).** `app/lib/profanity.js` wraps the
`bad-words` library. `POST /item`, `POST /item/:id/question`,
`POST /question/:id` and `POST /categories` all reject offensive language with
`400` before anything is written to the database.

**Extension 2 — categories (hard).** Two new tables (`categories` and the
many-to-many `item_categories`), a `GET /categories` endpoint plus
`POST /categories`, `category_ids` on `POST /item` so an item can be filed under
several categories, categories attached to `GET /item/:id` and `GET /search`
results, and a `category_id` filter on the search endpoint.

Changes to `database.js` are limited to the items `image` column, these two
tables and the rarity seed data; the original tables are untouched.
