require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const requestLogger = require("./middleware/requestLogger");
const propertiesRouter = require("./routes/properties");

// The Express app is built here and exported without calling listen(), so
// tests can drive it with supertest in-process while server.js owns the
// actual port binding.
const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

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

app.use("/api/properties", propertiesRouter);

module.exports = app;
