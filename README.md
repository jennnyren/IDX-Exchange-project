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

## Project structure

```
backend/
  server.js                # Express app, /api/health, route mounting
  db.js                    # mysql2 connection pool
  middleware/
    requestLogger.js       # logs method, URL, status, duration
  routes/
    properties.js          # all /api/properties endpoints
frontend/
  src/
    api/properties.js      # fetch wrappers for the API
    components/            # ListingsPage, PropertyCard, SortControls, ...
    hooks/useFavorites.js  # localStorage-backed favorites store
    utils/photos.js        # parses the L_Photos JSON column
docs/
  PERFORMANCE.md           # EXPLAIN analysis and indexing findings
  API-TESTING.md           # manual curl verification steps
rets_property.sql          # schema dumps (stale on indexes — see PERFORMANCE.md)
rets_openhouse.sql
```

## Getting started

### Prerequisites

- Node.js 20+
- A local MySQL 8.4 instance with the `rets` database loaded

### 1. Database

Import the dumps into a `rets` database. These docs assume MySQL running in a Docker
container named `idx-mysql-local`:

```bash
docker exec -i idx-mysql-local mysql -u root -p rets < rets_property.sql
docker exec -i idx-mysql-local mysql -u root -p rets < rets_openhouse.sql
```

`rets_property` holds ~28k listings. Note that the checked-in dumps do **not** reflect
the live table's indexes — see [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

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
cd frontend
npm test             # vitest run
npm run lint         # oxlint
```

The backend has no automated tests; endpoints are verified manually via
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

Array of open houses for the listing, ordered by date then start time. An empty
array is a successful `200` — not a `404`.

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

## Contributing

Commit messages follow `type(scope): short description`, where type is one of
`feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Pull requests use the template in
[.github/pull_request_template.md](.github/pull_request_template.md).
