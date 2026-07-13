const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  const { minPrice, maxPrice, beds, baths, limit, offset, city, zipcode } =
    req.query;

  // Validate numeric fields (decimals allowed)
  if (
    minPrice !== undefined &&
    (isNaN(Number(minPrice)) || Number(minPrice) < 0)
  ) {
    return res
      .status(400)
      .json({ error: "minPrice must be a non-negative number" });
  }

  if (
    maxPrice !== undefined &&
    (isNaN(Number(maxPrice)) || Number(maxPrice) < 0)
  ) {
    return res
      .status(400)
      .json({ error: "maxPrice must be a non-negative number" });
  }

  // Validate integer-only fields
  if (
    beds !== undefined &&
    (!Number.isInteger(Number(beds)) || Number(beds) < 0)
  ) {
    return res
      .status(400)
      .json({ error: "beds must be a non-negative integer" });
  }

  if (
    baths !== undefined &&
    (!Number.isInteger(Number(baths)) || Number(baths) < 0)
  ) {
    return res
      .status(400)
      .json({ error: "baths must be a non-negative integer" });
  }

  if (
    limit !== undefined &&
    (!Number.isInteger(Number(limit)) || Number(limit) < 0)
  ) {
    return res
      .status(400)
      .json({ error: "limit must be a non-negative integer" });
  }

  if (
    offset !== undefined &&
    (!Number.isInteger(Number(offset)) || Number(offset) < 0)
  ) {
    return res
      .status(400)
      .json({ error: "offset must be a non-negative integer" });
  }

  // city, zipcode: strings, no validation needed, passed as-is to the parameterized query

  // Build the filtered WHERE clause dynamically
  try {
    const where = [];
    const params = [];

    if (req.query.city) {
      where.push("LOWER(TRIM(L_City)) = LOWER(TRIM(?))");
      params.push(req.query.city);
    }
    if (req.query.zipcode) {
      where.push("LOWER(TRIM(L_Zip)) = LOWER(TRIM(?))");
      params.push(req.query.zipcode);
    }
    if (req.query.minPrice) {
      where.push("L_SystemPrice >= ?");
      params.push(Number(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      where.push("L_SystemPrice <= ?");
      params.push(Number(req.query.maxPrice));
    }
    if (req.query.beds) {
      where.push("L_Keyword2 >= ?");
      params.push(Number(req.query.beds));
    }
    if (req.query.baths) {
      where.push("LM_Dec_3 >= ?");
      params.push(Number(req.query.baths));
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Pagination
    const pageLimit = Number(limit) || 20;
    const pageOffset = Number(offset) || 0;

    // Count query
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM rets_property ${whereClause}`,
      params,
    );
    const total = countRows[0].total;

    // Page query
    const [results] = await pool.query(
      `SELECT * FROM rets_property ${whereClause} LIMIT ? OFFSET ?`,
      [...params, pageLimit, pageOffset],
    );

    res.json({ total, limit: pageLimit, offset: pageOffset, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
