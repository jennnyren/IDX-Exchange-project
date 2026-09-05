const express = require("express");
const router = express.Router();
const pool = require("../db");

// Whitelist mapping public sort keys to actual rets_property columns.
// sortBy must always be resolved through this map — never interpolated
// directly into SQL — since column names can't use `?` placeholders.
const SORT_COLUMNS = {
  price: "L_SystemPrice",
  dateListed: "OnMarketDate",
  sqft: "LM_Int2_3",
  beds: "L_Keyword2",
};

router.get("/", async (req, res) => {
  const {
    minPrice,
    maxPrice,
    beds,
    baths,
    limit,
    offset,
    city,
    zipcode,
    sortBy,
    sortOrder,
  } = req.query;

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

  if (sortBy !== undefined && !Object.hasOwn(SORT_COLUMNS, sortBy)) {
    return res.status(400).json({
      error: `sortBy must be one of: ${Object.keys(SORT_COLUMNS).join(", ")}`,
    });
  }

  if (
    sortOrder !== undefined &&
    !["asc", "desc"].includes(String(sortOrder).toLowerCase())
  ) {
    return res
      .status(400)
      .json({ error: "sortOrder must be 'asc' or 'desc'" });
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

    // ORDER BY column always comes from the SORT_COLUMNS whitelist, not the
    // raw query string, since column names can't be passed as `?` params.
    const orderClause = sortBy
      ? `ORDER BY ${SORT_COLUMNS[sortBy]} ${String(sortOrder || "asc").toUpperCase()}`
      : "";

    // Pagination (limit capped at 100 to bound response size)
    const pageLimit = Math.min(Number(limit) || 20, 100);
    const pageOffset = Number(offset) || 0;

    // Count query
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM rets_property ${whereClause}`,
      params,
    );
    const total = countRows[0].total;

    // Page query
    const [results] = await pool.query(
      `SELECT * FROM rets_property ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
      [...params, pageLimit, pageOffset],
    );

    res.json({ total, limit: pageLimit, offset: pageOffset, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/properties/:id/openhouses  — MUST come before /:id
router.get("/:id/openhouses", async (req, res) => {
  const { id } = req.params;

  // Validate the listing id (adjust if your IDs aren't integers)
  if (!id || id.trim() === "") {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM rets_openhouse
       WHERE L_ListingID = ?
       ORDER BY OpenHouseDate, OH_StartTime`,
      [id],
    );
    // Empty array is a valid, successful response — NOT a 404
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/properties/:id  — single property or 404
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    return res.status(400).json({ error: "id is required" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM rets_property WHERE L_ListingID = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `No property found with id ${id}` });
    }
    res.json(rows[0]); // one object, not an array
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
