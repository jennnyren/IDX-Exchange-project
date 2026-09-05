# Property Search Application

A full-stack property search app built on an IDX/RETS MLS dataset: an Express + MySQL
JSON API and a React (Vite) frontend for browsing, filtering, sorting, and saving
listings.

## Features

- **Listings grid** with server-side pagination (20 per page, capped at 100).
- **Filtering** by city, ZIP, price range, beds, and baths.
- **Sorting** by price, date listed, square footage, or beds — preserved across pages.
- **Property detail pages** with an image gallery, lightbox, open-house schedule, and a map.
- **Favorites** persisted to `localStorage` and shared across the app via a subscribable store.
- **Error boundary** that catches render errors per route instead of blanking the page.

## Tech stack

| Layer    | Stack                                                          |
| -------- | -------------------------------------------------------------- |
| Backend  | Node.js, Express 5, mysql2 (connection pool), dotenv, cors      |
| Frontend | React 19, React Router 7, Vite 7                               |
| Testing  | Vitest, React Testing Library, jest-dom, oxlint                 |
| Database | MySQL 8.4 (`rets_property`, `rets_openhouse`)                   |

## Architecture

```
Browser ── React (Vite, :3000)
              │  fetch("/api/...")
              ▼
        Vite dev proxy  ──────────►  Express (:8080)
                                        │  mysql2 pool (10 connections)
                                        ▼
                                     MySQL — rets_property, rets_openhouse
```

**Request flow.** Components never call `fetch` directly; they go through
[frontend/src/api/properties.js](frontend/src/api/properties.js), which builds the
query string, unwraps the JSON, and converts a non-2xx response into a thrown `Error`
carrying the server's `error` message. `ListingsPage` owns all search state (filters,
sort, page) and refetches whenever any of it changes, so a single `useEffect` drives
every load and there is one code path for the initial render, a filter change, a sort
change, and pagination alike.

**Server layering.** [app.js](backend/app.js) builds and exports the Express app;
[server.js](backend/server.js) only binds the port. That split is what lets the test
suite drive the real app in-process through Supertest without opening a socket. Route
handlers own their own validation and talk to a shared mysql2 pool from
[db.js](backend/db.js) — there is no ORM or repository layer, since the queries are
few and hand-tuned against the indexes documented in
[docs/PERFORMANCE.md](docs/PERFORMANCE.md).

**Why the API returns raw RETS columns.** Handlers `SELECT *` and pass rows through
untranslated, so `L_Keyword2` reaches the browser as `L_Keyword2`. This keeps the
backend thin and avoids a mapping layer that would need updating every time a new
column is displayed; the cost is that the frontend has to know the RETS names (see
[Data notes](#data-notes)) and that responses are wider than any single view needs.

**Client state.** There is no state library. Search state is component-local to
`ListingsPage`; favorites live in a module-level store in
[useFavorites.js](frontend/src/hooks/useFavorites.js) exposed via `useSyncExternalStore`
and persisted to `localStorage`. That store is shared by every consumer, so favoriting
from a card updates the nav count with no context provider or prop drilling.

## Project structure

```
backend/
  app.js                   # builds the Express app (exported for tests)
  server.js                # binds the port
  db.js                    # mysql2 connection pool
  app.test.js              # health check + request logger tests
  middleware/
    requestLogger.js       # logs method, URL, status, duration
  routes/
    properties.js          # all /api/properties endpoints
    properties.test.js     # route tests (Jest + Supertest, mocked pool)
frontend/
  src/
    api/properties.js      # fetch wrappers for the API
    components/            # ListingsPage, PropertyCard, SortControls, ...
    hooks/useFavorites.js  # localStorage-backed favorites store
    utils/photos.js        # parses the L_Photos JSON column
    test-setup.js          # jsdom setup + localStorage polyfill
docs/
  PERFORMANCE.md           # EXPLAIN analysis and indexing findings
  API-TESTING.md           # manual curl verification steps
rets_property.sql          # data dumps — gitignored, not in the repo
rets_openhouse.sql
```

Test files sit next to the code they cover (`properties.js` / `properties.test.js`).

## Getting started

### Prerequisites

- Node.js 20+
- A local MySQL 8.4 instance with the `rets` database loaded

### 1. Database

> **The SQL dumps are not in this repository.** `rets_property.sql` and
> `rets_openhouse.sql` are gitignored, so a fresh clone has no data — obtain them
> separately before setting up.

With the dumps in the repo root, import them into a `rets` database. These docs assume
MySQL running in a Docker container named `idx-mysql-local`:

```bash
docker exec -i idx-mysql-local mysql -u root -p rets < rets_property.sql
docker exec -i idx-mysql-local mysql -u root -p rets < rets_openhouse.sql
```

`rets_property` holds ~28k listings. Note that the dumps do **not** reflect the live
table's indexes — see [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

### 2. Backend

Create `backend/.env` (git-ignored):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=rets
PORT=8080
```

```bash
cd backend
npm install
npm run dev          # nodemon on http://localhost:8080
```

Verify: `curl http://localhost:8080/api/health` → `{"status":"ok","database":"connected"}`

### 3. Frontend

Create `frontend/.env` (git-ignored) if you want maps on the detail page:

```
VITE_GOOGLE_MAPS_API_KEY=your-key
```

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Vite proxies `/api` to `http://localhost:8080`, so both servers must be running.

## Testing

```bash
cd backend
npm test                 # jest
npm run test:coverage    # jest --coverage

cd frontend
npm test                 # vitest run
npm run test:coverage    # vitest run --coverage
npm run lint             # oxlint
```

Both suites enforce a **70% minimum** on lines, statements, branches, and functions;
the run fails if coverage drops below it. Thresholds live in
[backend/package.json](backend/package.json) (`jest.coverageThreshold`) and
[frontend/vite.config.js](frontend/vite.config.js) (`test.coverage.thresholds`).

**Backend** — Jest + Supertest drive the exported app in-process. The mysql2 pool is
mocked module-wide (`jest.mock("../db")`), so no test needs a database: each test
queues the rows `pool.query` should resolve with and then asserts on both the response
and the SQL that was generated. Covered: the paginated envelope and limit cap, every
filter type and its bound parameters, sort mapping through the column whitelist,
each validation rejection, 404 and 400 paths, SQL-injection attempts through `sortBy`
and `:id`, and 500 handling on a failed query.

**Frontend** — Vitest + React Testing Library, querying by role and label rather than
by class name. Components are tested through user-visible behavior (typing into
filters, clicking pages, toggling a favorite); the API module is mocked at the
boundary so no component test performs real I/O.

For manual endpoint verification against a live database, see
[docs/API-TESTING.md](docs/API-TESTING.md).

## API reference

Base URL: `http://localhost:8080/api`

### `GET /properties`

Returns a paginated, filtered, optionally sorted page of listings.

| Param       | Type    | Notes                                                        |
| ----------- | ------- | ------------------------------------------------------------ |
| `city`      | string  | Exact match on `L_City`                                       |
| `zipcode`   | string  | Exact match on `L_Zip`                                        |
| `minPrice`  | number  | Decimals allowed                                              |
| `maxPrice`  | number  | Decimals allowed                                              |
| `beds`      | number  | Minimum beds                                                  |
| `baths`     | number  | Minimum baths                                                 |
| `sortBy`    | enum    | `price`, `dateListed`, `sqft`, `beds`                         |
| `sortOrder` | enum    | `asc` (default) or `desc`                                     |
| `limit`     | integer | Default 20, capped at 100                                     |
| `offset`    | integer | Default 0                                                     |

```json
{ "total": 28251, "limit": 20, "offset": 0, "results": [ /* ... */ ] }
```

Invalid numeric params, an unknown `sortBy`, or a `sortOrder` other than `asc`/`desc`
return `400` with an `{ "error": "..." }` body. `sortBy` is resolved through a
column whitelist — column names can't be passed as prepared-statement placeholders,
so the raw query string never reaches the SQL.

### `GET /properties/:id`

One property object, or `404` if the listing id doesn't exist.

### `GET /properties/:id/openhouses`

Array of open houses for the listing, ordered by date then start time.

| Case                                    | Response          |
| --------------------------------------- | ----------------- |
| Listing exists, has open houses         | `200` with array  |
| Listing exists, none scheduled          | `200` with `[]`   |
| Listing id not in `rets_property`       | `404`             |
| Blank id                                | `400`             |

The empty-list and unknown-listing cases are deliberately distinguished, which costs
an extra existence query against `rets_property` before the open-house lookup.

## Data notes

`rets_property` uses raw RETS column names. The ones this app reads:

| Column           | Meaning         |
| ---------------- | --------------- |
| `L_ListingID`    | Listing id (PK) |
| `L_SystemPrice`  | Price           |
| `L_Address`      | Street address  |
| `L_City`         | City            |
| `L_State`        | State           |
| `L_Zip`          | ZIP code        |
| `L_Keyword2`     | Beds            |
| `LM_Dec_3`       | Baths           |
| `LM_Int2_3`      | Square footage  |
| `L_Photos`       | JSON array of photo URLs |
| `OnMarketDate`   | Date listed     |

mysql2 returns `DECIMAL` columns (price, baths) as **strings** and `INT` columns as
numbers, so numeric fields should be coerced before formatting or comparison.

## Known issues and limitations

**Data and API**

- `SELECT *` returns every RETS column (100+ per row) even though the grid displays
  seven. Responses are far larger than they need to be; a column list scoped per
  endpoint would fix it.
- Deep pagination degrades. `LIMIT ? OFFSET ?` makes MySQL walk and discard every
  skipped row, so page 500 is measurably slower than page 1 — see
  [docs/PERFORMANCE.md](docs/PERFORMANCE.md). Keyset pagination would be the fix.
- Sorting is unstable for ties. `ORDER BY L_SystemPrice` with no tiebreaker lets rows
  of equal price shuffle between pages, so a listing can appear twice or not at all
  while paging. Appending `L_ListingID` as a secondary sort would make it deterministic.
- `city` and `zipcode` are exact matches (case- and whitespace-insensitive, but exact).
  There is no partial match, no autocomplete, and no multi-city selection.
- The open-houses endpoint issues two queries per request since adding the 404 case.
- No caching, rate limiting, or authentication anywhere.

**Frontend**

- Filter and sort state lives in React state only — not in the URL. Refreshing or
  sharing a link loses the search, and the browser Back button doesn't step through
  filter changes.
- Favorites are stored per browser in `localStorage`. They don't sync across devices,
  and clearing site data loses them. Only the listing id and a snapshot of the row are
  kept, so a favorited listing's price can go stale relative to the database.
- Sorting resets whenever filters are applied or cleared. This is deliberate (a stale
  sort over a new result set was confusing) but it does surprise people who expect the
  sort to stick.
- `PropTypes` are declared on `PropertyCard` but React 19 removed runtime propType
  validation, and oxlint implements no `react/prop-types` rule — so they document the
  shape without enforcing it.
- No loading skeletons; the grid is replaced by a "Loading properties..." line on
  every fetch, which flashes on fast connections.

**Testing and tooling**

- The backend suite mocks the database entirely. It verifies the SQL the handlers
  *build*, not that the SQL is valid against a real schema — a typo'd column name
  would pass the tests and fail in production. There are no integration tests against
  a live MySQL instance.
- The SQL dumps are gitignored, so the repo alone doesn't reproduce the environment —
  a clean clone has no schema and no data. The dumps that do circulate are also stale
  with respect to indexes; trust the live schema and
  [docs/PERFORMANCE.md](docs/PERFORMANCE.md) instead.
- `@vitest/coverage-v8` is pinned to an exact version because the floating range trips
  an npm resolver bug (`Cannot read properties of null (reading 'children')`).

## Contributing

Commit messages follow `type(scope): short description`, where type is one of
`feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Pull requests use the template in
[.github/pull_request_template.md](.github/pull_request_template.md).
