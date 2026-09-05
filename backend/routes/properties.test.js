const request = require("supertest");

// The pool is mocked module-wide so no test ever opens a MySQL connection.
// Each handler calls pool.query(sql, params) and destructures [rows], so the
// mock resolves to a [rows, fields] tuple exactly like mysql2/promise does.
jest.mock("../db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require("../db");
const app = require("../app");

/** Resolves the next pool.query call with `rows` in mysql2's [rows, fields] shape. */
function mockRows(rows) {
  pool.query.mockResolvedValueOnce([rows, []]);
}

/** The list endpoint issues a COUNT query before the page query, in that order. */
function mockListQueries(total, results) {
  mockRows([{ total }]);
  mockRows(results);
}

const property = {
  L_ListingID: "1077426281",
  L_SystemPrice: "450000.00",
  L_Address: "1 Main St",
  L_City: "Boston",
  L_State: "MA",
  L_Zip: "02118",
  L_Keyword2: 3,
  LM_Dec_3: "2.0",
  LM_Int2_3: 1500,
};

/** SQL text of the nth pool.query call (0-indexed), whitespace-normalized. */
function sqlOf(callIndex) {
  return pool.query.mock.calls[callIndex][0].replace(/\s+/g, " ").trim();
}

/** Bound parameters of the nth pool.query call. */
function paramsOf(callIndex) {
  return pool.query.mock.calls[callIndex][1];
}

beforeEach(() => {
  jest.clearAllMocks();
  // requestLogger logs every request and the handlers log caught errors;
  // both are silenced so the reporter output stays readable.
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /api/properties", () => {
  it("returns a paginated envelope with the default limit and offset", async () => {
    mockListQueries(28251, [property]);

    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 28251,
      limit: 20,
      offset: 0,
      results: [property],
    });
  });

  it("issues no WHERE or ORDER BY clause when no filters are given", async () => {
    mockListQueries(1, [property]);

    await request(app).get("/api/properties");

    expect(sqlOf(1)).toBe("SELECT * FROM rets_property LIMIT ? OFFSET ?");
    expect(paramsOf(1)).toEqual([20, 0]);
  });

  describe("pagination", () => {
    it("passes limit and offset through to the page query", async () => {
      mockListQueries(100, []);

      const res = await request(app).get("/api/properties?limit=5&offset=10");

      expect(paramsOf(1)).toEqual([5, 10]);
      expect(res.body).toMatchObject({ limit: 5, offset: 10 });
    });

    it("caps limit at 100 to bound the response size", async () => {
      mockListQueries(100, []);

      const res = await request(app).get("/api/properties?limit=500");

      expect(paramsOf(1)).toEqual([100, 0]);
      expect(res.body.limit).toBe(100);
    });

    it("counts the full filtered set, not just the returned page", async () => {
      mockListQueries(45, [property]);

      const res = await request(app).get("/api/properties?limit=20");

      expect(sqlOf(0)).toBe("SELECT COUNT(*) AS total FROM rets_property");
      expect(res.body.total).toBe(45);
    });
  });

  describe("filters", () => {
    // One case per supported filter: the WHERE fragment it should produce and
    // the value that should be bound as a parameter (never interpolated).
    const cases = [
      ["city", "Boston", "LOWER(TRIM(L_City)) = LOWER(TRIM(?))", "Boston"],
      ["zipcode", "02118", "LOWER(TRIM(L_Zip)) = LOWER(TRIM(?))", "02118"],
      ["minPrice", "200000", "L_SystemPrice >= ?", 200000],
      ["maxPrice", "800000", "L_SystemPrice <= ?", 800000],
      ["beds", "3", "L_Keyword2 >= ?", 3],
      ["baths", "2", "LM_Dec_3 >= ?", 2],
    ];

    it.each(cases)(
      "filters by %s",
      async (param, value, expectedClause, expectedBinding) => {
        mockListQueries(1, [property]);

        const res = await request(app).get(
          `/api/properties?${param}=${encodeURIComponent(value)}`,
        );

        expect(res.status).toBe(200);
        expect(sqlOf(1)).toContain(`WHERE ${expectedClause}`);
        expect(paramsOf(1)).toEqual([expectedBinding, 20, 0]);
      },
    );

    it("combines multiple filters with AND", async () => {
      mockListQueries(1, [property]);

      await request(app).get(
        "/api/properties?city=Boston&beds=3&minPrice=200000",
      );

      expect(sqlOf(1)).toContain(
        "WHERE LOWER(TRIM(L_City)) = LOWER(TRIM(?)) AND L_SystemPrice >= ? AND L_Keyword2 >= ?",
      );
      expect(paramsOf(1)).toEqual(["Boston", 200000, 3, 20, 0]);
    });

    it("applies the same filters to the count query", async () => {
      mockListQueries(1, [property]);

      await request(app).get("/api/properties?city=Boston");

      expect(sqlOf(0)).toContain("WHERE LOWER(TRIM(L_City)) = LOWER(TRIM(?))");
      expect(paramsOf(0)).toEqual(["Boston"]);
    });
  });

  describe("sorting", () => {
    it.each([
      ["price", "L_SystemPrice"],
      ["dateListed", "OnMarketDate"],
      ["sqft", "LM_Int2_3"],
      ["beds", "L_Keyword2"],
    ])("maps sortBy=%s to the %s column", async (sortBy, column) => {
      mockListQueries(1, [property]);

      const res = await request(app).get(
        `/api/properties?sortBy=${sortBy}&sortOrder=desc`,
      );

      expect(res.status).toBe(200);
      expect(sqlOf(1)).toContain(`ORDER BY ${column} DESC`);
    });

    it("defaults to ascending order when sortOrder is omitted", async () => {
      mockListQueries(1, [property]);

      await request(app).get("/api/properties?sortBy=price");

      expect(sqlOf(1)).toContain("ORDER BY L_SystemPrice ASC");
    });
  });

  describe("invalid input", () => {
    it.each([
      ["minPrice=abc", "minPrice must be a non-negative number"],
      ["minPrice=-1", "minPrice must be a non-negative number"],
      ["maxPrice=abc", "maxPrice must be a non-negative number"],
      ["maxPrice=-5", "maxPrice must be a non-negative number"],
      ["beds=2.5", "beds must be a non-negative integer"],
      ["beds=-1", "beds must be a non-negative integer"],
      ["baths=abc", "baths must be a non-negative integer"],
      ["limit=abc", "limit must be a non-negative integer"],
      ["limit=-10", "limit must be a non-negative integer"],
      ["offset=1.5", "offset must be a non-negative integer"],
      ["offset=-1", "offset must be a non-negative integer"],
      ["sortOrder=sideways", "sortOrder must be 'asc' or 'desc'"],
    ])("rejects %s with 400", async (queryString, expectedError) => {
      const res = await request(app).get(`/api/properties?${queryString}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(expectedError);
      // Validation must short-circuit before any database work happens.
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("rejects an unknown sortBy and names the allowed keys", async () => {
      const res = await request(app).get("/api/properties?sortBy=L_City");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "sortBy must be one of: price, dateListed, sqft, beds",
      );
      expect(pool.query).not.toHaveBeenCalled();
    });

    it("rejects a SQL injection attempt through sortBy", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=" +
          encodeURIComponent("L_SystemPrice; DROP TABLE rets_property--"),
      );

      expect(res.status).toBe(400);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  it("returns 500 when the database query fails", async () => {
    pool.query.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await request(app).get("/api/properties");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/properties/:id", () => {
  it("returns a single property object, not an array", async () => {
    mockRows([property]);

    const res = await request(app).get("/api/properties/1077426281");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(false);
    expect(res.body).toEqual(property);
    expect(paramsOf(0)).toEqual(["1077426281"]);
  });

  it("returns 404 when no property has that id", async () => {
    mockRows([]);

    const res = await request(app).get("/api/properties/9999999999");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "No property found with id 9999999999",
    });
  });

  it("returns 400 for a blank id", async () => {
    const res = await request(app).get("/api/properties/%20");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "id is required" });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("binds the id as a parameter rather than interpolating it", async () => {
    mockRows([]);

    await request(app).get(
      "/api/properties/" + encodeURIComponent("1' OR '1'='1"),
    );

    expect(sqlOf(0)).toBe("SELECT * FROM rets_property WHERE L_ListingID = ?");
    expect(paramsOf(0)).toEqual(["1' OR '1'='1"]);
  });

  it("returns 500 when the database query fails", async () => {
    pool.query.mockRejectedValueOnce(new Error("boom"));

    const res = await request(app).get("/api/properties/1077426281");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/properties/:id/openhouses", () => {
  const openHouse = {
    L_ListingID: "1077426281",
    OpenHouseDate: "2026-06-15",
    OH_StartTime: "12:00:00",
    OH_EndTime: "14:00:00",
  };

  it("returns the open houses for an existing property", async () => {
    mockRows([{ L_ListingID: "1077426281" }]); // existence check
    mockRows([openHouse]);

    const res = await request(app).get(
      "/api/properties/1077426281/openhouses",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([openHouse]);
  });

  it("orders open houses by date then start time", async () => {
    mockRows([{ L_ListingID: "1077426281" }]);
    mockRows([openHouse]);

    await request(app).get("/api/properties/1077426281/openhouses");

    expect(sqlOf(1)).toContain("ORDER BY OpenHouseDate, OH_StartTime");
  });

  it("returns an empty array (200) when the property has no open houses", async () => {
    mockRows([{ L_ListingID: "1118422731" }]);
    mockRows([]);

    const res = await request(app).get(
      "/api/properties/1118422731/openhouses",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 404 when the property itself does not exist", async () => {
    mockRows([]); // existence check finds nothing

    const res = await request(app).get(
      "/api/properties/9999999999/openhouses",
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "No property found with id 9999999999",
    });
    // The open-house query must not run once the property is known to be absent.
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for a blank id", async () => {
    const res = await request(app).get("/api/properties/%20/openhouses");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "id is required" });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("takes precedence over the /:id route", async () => {
    mockRows([{ L_ListingID: "1077426281" }]);
    mockRows([openHouse]);

    const res = await request(app).get(
      "/api/properties/1077426281/openhouses",
    );

    // If /:id were matching first, this would be a single object.
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 500 when the database query fails", async () => {
    pool.query.mockRejectedValueOnce(new Error("boom"));

    const res = await request(app).get(
      "/api/properties/1077426281/openhouses",
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
