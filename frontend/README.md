# Auctionary — front end

The Vue 3 front end for the **Auctionary** assignment. It is a themed auction
site — the product is *Auctionary*, a white-label auction platform, and this
deployment is branded for trading cards. It talks to the Auctionary API running
on `http://localhost:3333`.

## Running it

The back end has to be running first.

    # terminal 1 - from the Auctionary folder
    cd backend
    npm install
    npm run dev            # http://localhost:3333

    # terminal 2 - from the Auctionary folder
    cd frontend
    npm install
    npm run dev            # http://localhost:5173

To check the production build:

    npm run build
    npm run preview

To lint / format:

    npm run lint           # oxlint + eslint
    npm run format         # prettier

## Demo accounts

Start the back end with `node demo.js` (it loads the 47-card demo catalogue when
the database is still empty) or seed it separately with `node seed-cards.js`.
All six accounts use the password `Password123!`.

| account | name | notes |
|---|---|---|
| wang@example.com | Wang | sells most of the cards |
| li@example.com | Li | sells the rest |
| sun.jiaqi@example.com | Sun Jiaqi | sells a few cards |
| zhang@example.com | Zhang | has already placed bids |
| chen@example.com | Chen | has already placed bids |
| zhou@example.com | Zhou | has already placed bids |

## Pages

| route | what it does | API used |
|---|---|---|
| `/` | browse and search the catalogue, filter by rarity; signed-in users also get "my open listings" / "auctions I'm bidding on" / "my ended listings" | `GET /search`, `GET /categories` |
| `/item/:id` | item detail, bid history, place a bid, ask and answer questions | `GET /item/:id`, `GET`/`POST /item/:id/bid`, `GET`/`POST /item/:id/question`, `POST /question/:id` |
| `/login` | sign in | `POST /login` |
| `/register` | create an account | `POST /users` |
| `/profile` | selling / bidding on / ended auctions (login required) | `GET /users/:id`, `POST /logout` |
| `/add-item` | list a new card, upload a photo (resized in the browser), pick categories, save a draft (login required) | `POST /item`, `GET /categories` |
| `/drafts` | local drafts: view, edit and delete (login required) | browser storage only |
| anything else | 404 page | - |

## Structure

    src/
      router/index.js         routes and the login guard
      services/
        session.js            reactive session state (wraps localStorage)
        user.service.js       /users, /login, /logout
        core.service.js       /search, /item, bids, questions, /categories
        draft.service.js      extension 3 - drafts in localStorage
      views/
        App.vue               header, navigation, page frame
        components/           AuctionCard, BidHistory, QuestionList
        pages/                HomeView, ItemDetailView, LoginView, RegisterView,
                              ProfileView, AddItemView, DraftsView, NotFoundView
      assets/main.css         brand styles (CSS custom properties)

## Brand

The theme is a bright "collector" trading-card brand:

- **Colour** — pink `#ff4fa3` (primary), yellow `#ffd83d` (bids and highlights),
  blue `#3aa0ff` (secondary), mint `#4fd6a8`, ink `#3a2c3a`. Every colour is
  declared once as a CSS custom property in `src/assets/main.css`.
- **Typography** — "Baloo 2" for headings, "Noto Sans SC" for body copy.
- **Components** — a single pill-shaped button system (`.btn`, `.btn.accent`,
  `.btn.blue`, `.btn.ghost`), rounded card surfaces, and rarity badges
  (`SSP`, `SP`, `RRR`, `SR`, common) which also double as the API categories.
- **Voice** — short, friendly, collector-facing copy.

## Notes

- Both services point at `http://localhost:3333` (see `src/services/*.js`).
- The session token and user id live in `localStorage`, wrapped by
  `src/services/session.js` as one reactive object so the header updates the
  moment a user signs in or out.
- Extension 3 (drafts) is entirely client side; drafts survive a page reload and
  are deleted once their item has been posted.
- The catalogue is paged through the API's `limit`/`offset` parameters, 24 cards
  per page, and the two headline numbers on the home page are counted from the
  API rather than hard coded.
- The headings use **Baloo 2**, self-hosted in `public/fonts` (SIL Open Font
  License 1.1) so the app has no third-party font CDN dependency; body copy
  falls back to the system font stack.
