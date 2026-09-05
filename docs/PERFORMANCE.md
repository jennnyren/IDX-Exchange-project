# Query Performance: EXPLAIN and Indexing

Findings against the live `rets` database (MySQL 8.4.10, `rets_property`, 28,251 rows)
running in the `idx-mysql-local` Docker container.

## Correction to an initial assumption

Before touching anything, the `rets_property.sql` dump in the repo root was checked
for index definitions and appeared to have none. That dump is stale — the **live**
table already had single-column indexes:

```
idx_city    (L_City)
idx_zip     (L_Zip)
idx_price   (L_SystemPrice)
idx_beds    (L_Keyword2)
idx_baths   (LM_Dec_3)
```

All measurements below reflect the actual live schema, not the stale dump.

## EXPLAIN column reference

| Column | Meaning |
|---|---|
| `id` | Which `SELECT` this row of output describes (all our queries are a single `SELECT`, so always `1`). |
| `select_type` | Query type — `SIMPLE` here (no subqueries/unions). |
| `table` | The table this row's access plan applies to. |
| `type` | Join/access method, worst to best: `ALL` (full table scan) → `range` (index range scan) → `ref` (index lookup on a non-unique equality) → `const`/`eq_ref` (single-row lookup). This is the single most important column. |
| `possible_keys` | Indexes the optimizer *could* have used given the `WHERE` clause. `NULL` means no index matched the predicates at all. |
| `key` | The index the optimizer actually chose. `NULL` = full table scan. |
| `key_len` | Bytes of the index actually used — useful for confirming how many columns of a composite index were applied. |
| `ref` | What's being compared against the index (a constant, another column, etc.). |
| `rows` | Estimated number of rows MySQL expects to examine (not necessarily return) — the main cost signal. |
| `filtered` | Estimated percentage of the examined rows that survive the `WHERE` clause after the index access — low numbers mean the index got you close but a lot of post-filtering (`Using where`) still happens in-memory. |
| `Extra` | Extra execution detail. The two that matter most here: `Using where` (a filter is applied after the index/table access — the index didn't cover the whole predicate) and `Using filesort` (no index provided the required order, so MySQL sorts the result set separately — expensive on large result sets). |

`EXPLAIN ANALYZE` (used below for the actual before/after numbers) additionally runs
the query for real and annotates every plan node with `actual time=first_row..last_row
rows=N loops=N` in **milliseconds** — this is what the "before/after" timings below
come from, not wall-clock `curl`/shell timing (queries here are fast enough, ~ms, that
shell-level timers only have 10ms+ resolution and can't distinguish before from after).

## Baseline: the most complex query (city + price range + beds, sorted, paginated)

This mirrors the worst case `PropertyFilters.jsx` + `SortControls.jsx` can produce
together:

```sql
SELECT * FROM rets_property
WHERE LOWER(TRIM(L_City)) = LOWER(TRIM('Los Angeles'))
  AND L_SystemPrice >= 200000 AND L_SystemPrice <= 900000
  AND L_Keyword2 >= 2
ORDER BY L_SystemPrice ASC
LIMIT 20 OFFSET 0;
```

**Before** (only the pre-existing single-column indexes):

```
type: range
possible_keys: idx_price, idx_beds
key: idx_price
Extra: Using index condition; Using where
actual time: ~12.1ms warm, scanning 4744 rows to return 20
```

**The real finding:** `idx_city` already existed but was completely unusable —
the route wraps the filter in `LOWER(TRIM(L_City))` (`backend/routes/properties.js`),
and MySQL cannot match a plain-column index against a function of that column.
Confirmed directly: `WHERE L_City = 'Los Angeles'` (no wrapping) uses `idx_city`
with `type=ref, rows=1`; the app's actual wrapped query ignores it entirely and
falls back to scanning by price only, then filtering city/beds row-by-row
(`Using where`). Same story for `L_Zip` — `idx_zip` was equally dead for the app's
real queries.

Two other endpoints were full table scans with **no usable index at all**:
- `GET /api/properties/:id` (`WHERE L_ListingID = ?`) — no index on `L_ListingID`.
- Sorting by `dateListed` (`ORDER BY OnMarketDate`) — no index on `OnMarketDate`,
  so every date-sorted request did a full scan *and* a filesort.

## Indexes added

```sql
ALTER TABLE rets_property
  ADD INDEX idx_city_norm_price ((LOWER(TRIM(L_City))), L_SystemPrice),
  ADD INDEX idx_zip_norm ((LOWER(TRIM(L_Zip)))),
  ADD INDEX idx_onmarketdate (OnMarketDate),
  ADD INDEX idx_listingid (L_ListingID);
```

- `idx_city_norm_price` is a **functional index** (MySQL 8.0.13+) matching the
  exact expression the app queries by, with price appended so the most common
  combination — "browse a city, filtered/sorted by price" — is satisfied by one
  index instead of falling back to a single-column scan-and-filter.
- `idx_zip_norm` — same functional-index fix for zip lookups.
- `idx_onmarketdate` — lets "Date Listed" sort avoid a filesort.
- `idx_listingid` — not one of the *search* filters, but the single-property and
  open-house lookups were doing a full scan on every request; same category of
  fix, and the single biggest win of the four.

One unrelated hazard hit while adding these: the ALTER requires an InnoDB table
rebuild for the functional indexes, which re-validates every column default
against the current `sql_mode`. `active_check TIMESTAMP NOT NULL DEFAULT
'0000-00-00 00:00:00'` fails under `NO_ZERO_DATE` (enabled by default) — a
pre-existing schema issue, unrelated to indexing. Worked around by relaxing
`sql_mode` for the session running the `ALTER TABLE` only; nothing persisted,
no data or schema changed besides the new indexes.

## Measured improvement (EXPLAIN ANALYZE, warm cache, 2nd run of each)

| Query | Before | After | Rows examined |
|---|---|---|---|
| City + price + beds, sorted (LA example) | 12.1ms, `type=range` on `idx_price` only | **0.55ms**, `type=range` on `idx_city_norm_price` | 4744 → 124 |
| Zip lookup (`zipcode=92211`) | 651ms, `type=ALL` (full scan) | **1.18ms**, `type=ref` on `idx_zip_norm` | 28,251 → 298 |
| Single property (`L_ListingID = ?`) | 627ms, `type=ALL` (full scan) | **0.034ms**, `type=eq_ref` on `idx_listingid` | 28,251 → 1 |
| Date-listed sort | 577ms, `type=ALL` + `Using filesort` | **0.086ms**, reverse index scan on `idx_onmarketdate`, no filesort | 28,251 → 20 |

(The "before" full-scan numbers include the ~600ms cost of MySQL reading and
filtering all 28,251 rows through the buffer pool even when warm; the zip/city
predicates were previously *unindexable*, not just slow.)

Correctness check: re-ran the same four scenarios through the actual
`GET /api/properties` and `GET /api/properties/:id` endpoints after indexing —
identical result shapes and row counts as before (indexes only change the
execution plan, never query semantics).
