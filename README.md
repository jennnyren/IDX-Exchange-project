# ===== A. GET /:id (single property) =====

# A1 known id -> 200, a single JSON object

curl "http://localhost:8080/api/properties/1077426281"
curl -s "http://localhost:8080/api/properties/1077426281" | jq '{L_ListingID, L_City, L_SystemPrice}'

# A2 unknown id -> 404 + JSON error message

curl -s -i "http://localhost:8080/api/properties/9999999999"
curl -s "http://localhost:8080/api/properties/9999999999" | jq .

# A3 blank id -> 400

curl -s -i "http://localhost:8080/api/properties/%20"

# ===== B. GET /:id/openhouses =====

# B4 property WITH an open house -> 200, array of length 1

curl "http://localhost:8080/api/properties/1077426281/openhouses"
curl -s "http://localhost:8080/api/properties/1077426281/openhouses" | jq 'length'

# B5 valid property, NO open houses -> 200, empty array [] (not 404)

curl "http://localhost:8080/api/properties/1118422731/openhouses"
curl -s "http://localhost:8080/api/properties/1118422731/openhouses" | jq .

# B6 blank id -> 400

curl -s -i "http://localhost:8080/api/properties/%20/openhouses"

# ===== C. Route order (openhouses must win over /:id) =====

# C7 must return an ARRAY (the open houses), not a single property object

curl -s "http://localhost:8080/api/properties/1077426281/openhouses" | jq 'type'

# expect: "array" (if you see "object", /:id is swallowing the route)

# ===== D. Request logging middleware =====

# No curl to assert this — run any request above, then LOOK at the terminal

# running `npm run dev`. You should see a line like:

# GET /api/properties/1077426281 200 3.4ms

# Confirm it shows: method + URL + status code + duration(ms).

# ===== E. Ordering (needs 2 seeded open houses, then cleanup) =====

# E1 seed two extra open houses for 1077426281 (earlier dates/times)

docker exec idx-mysql-local mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "INSERT INTO rets_openhouse (L_ListingID,L_DisplayId,OpenHouseDate,OH_StartTime,OH_EndTime,OH_StartDate,OH_EndDate,all_data,updated_date) VALUES ('1077426281','TEST','2026-06-16','08:00:00','10:00:00','2026-06-16','2026-06-16','{}',NOW()),('1077426281','TEST','2026-06-15','12:00:00','14:00:00','2026-06-15','2026-06-15','{}',NOW());" rets

# E2 fetch -> should be ordered: 2026-06-15 12:00, 2026-06-16 08:00, 2026-06-16 09:00

curl -s "http://localhost:8080/api/properties/1077426281/openhouses" | jq '[.[] | {OpenHouseDate, OH_StartTime}]'

# E3 CLEAN UP (restores your data exactly — always run this)

docker exec idx-mysql-local mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "DELETE FROM rets_openhouse WHERE L_ListingID='1077426281' AND L_DisplayId='TEST';" rets
The IDs are real, pulled from your DB:

1077426281 — exists, has 1 open house
1118422731 — exists, has no open houses (tests the empty [])
9999999999 — not in the table (tests 404)
