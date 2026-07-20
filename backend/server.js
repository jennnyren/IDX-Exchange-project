require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// Log every request: method, URL, status code, duration in ms
app.use((req, res, next) => {
  const start = process.hrtime.bigint(); // high-precision start time
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`,
    );
  });
  next(); // hand off to the next handler — REQUIRED
});

app.get("/api/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});
const propertiesRouter = require("./routes/properties");
app.use("/api/properties", propertiesRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
