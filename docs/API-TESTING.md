# Manual API Verification

Curl checks for the `/api/properties` endpoints. Run the backend (`cd backend && npm run dev`)
first, and export the DB password before the seeding steps in section E:

```bash
export MYSQL_ROOT_PASSWORD='...'   # do not commit the real value
```

The listing ids below are real, pulled from the local `rets` database:

| Id           | Why                                          |
| ------------ | -------------------------------------------- |
| `1077426281` | Exists, has 1 open house                     |
| `1118422731` | Exists, has no open houses (tests empty `[]`) |
| `9999999999` | Not in the table (tests 404)                 |

## A. `GET /:id` (single property)

**A1 — known id → 200, a single JSON object**

```bash
curl "http://localhost:8080/api/properties/1077426281"
curl -s "http://localhost:8080/api/properties/1077426281" | jq '{L_ListingID, L_City, L_SystemPrice}'
```

**A2 — unknown id → 404 + JSON error message**

```bash
curl -s -i "http://localhost:8080/api/properties/9999999999"
curl -s "http://localhost:8080/api/properties/9999999999" | jq .
```

**A3 — blank id → 400**

```bash
curl -s -i "http://localhost:8080/api/properties/%20"
```

## B. `GET /:id/openhouses`

**B4 — property with an open house → 200, array of length 1**

```bash
curl "http://localhost:8080/api/properties/1077426281/openhouses"
curl -s "http://localhost:8080/api/properties/1077426281/openhouses" | jq 'length'
```

**B5 — valid property, no open houses → 200, empty array `[]` (not 404)**

```bash
curl "http://localhost:8080/api/properties/1118422731/openhouses"
curl -s "http://localhost:8080/api/properties/1118422731/openhouses" | jq .
```

**B6 — blank id → 400**

```bash
curl -s -i "http://localhost:8080/api/properties/%20/openhouses"
```

## C. Route order (`/openhouses` must win over `/:id`)

**C7 — must return an ARRAY (the open houses), not a single property object**

```bash
curl -s "http://localhost:8080/api/properties/1077426281/openhouses" | jq 'type'
```

Expect `"array"`. If you see `"object"`, the `/:id` route is swallowing the request.

## D. Request logging middleware

No curl assertion for this — run any request above, then look at the terminal running
`npm run dev`. You should see a line like:

```
GET /api/properties/1077426281 200 3.4ms
```

Confirm it shows method + URL + status code + duration in ms.

## E. Open-house ordering

Requires seeding two extra open houses, then cleaning up.

**E1 — seed two extra open houses for `1077426281` (earlier dates/times)**

```bash
docker exec idx-mysql-local mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
  "INSERT INTO rets_openhouse (L_ListingID,L_DisplayId,OpenHouseDate,OH_StartTime,OH_EndTime,OH_StartDate,OH_EndDate,all_data,updated_date) VALUES ('1077426281','TEST','2026-06-16','08:00:00','10:00:00','2026-06-16','2026-06-16','{}',NOW()),('1077426281','TEST','2026-06-15','12:00:00','14:00:00','2026-06-15','2026-06-15','{}',NOW());" rets
```

**E2 — fetch → should be ordered 2026-06-15 12:00, 2026-06-16 08:00, 2026-06-16 09:00**

```bash
curl -s "http://localhost:8080/api/properties/1077426281/openhouses" | jq '[.[] | {OpenHouseDate, OH_StartTime}]'
```

**E3 — clean up (restores the data exactly — always run this)**

```bash
docker exec idx-mysql-local mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e \
  "DELETE FROM rets_openhouse WHERE L_ListingID='1077426281' AND L_DisplayId='TEST';" rets
```
