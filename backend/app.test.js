const request = require("supertest");

jest.mock("./db", () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require("./db");
const app = require("./app");

let logSpy;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /api/health", () => {
  it("reports ok when a connection can be acquired", async () => {
    const connection = { query: jest.fn().mockResolvedValue([[{ 1: 1 }], []]), release: jest.fn() };
    pool.getConnection.mockResolvedValueOnce(connection);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "connected" });
    // The connection must go back to the pool or the pool leaks under load.
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it("reports disconnected with a 500 when the pool cannot connect", async () => {
    pool.getConnection.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ status: "error", database: "disconnected" });
  });
});

describe("requestLogger middleware", () => {
  it("logs the method, URL, status code, and duration of each request", async () => {
    pool.getConnection.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await request(app).get("/api/health");

    const logged = logSpy.mock.calls.map((args) => args[0]).join("\n");
    expect(logged).toMatch(/^GET \/api\/health 500 \d+\.\d+ms$/m);
  });
});

describe("unknown routes", () => {
  it("returns 404 for a path the app does not handle", async () => {
    const res = await request(app).get("/api/nonexistent");

    expect(res.status).toBe(404);
  });
});
