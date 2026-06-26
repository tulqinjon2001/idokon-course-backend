const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { allowedOrigins } = require("./config/env");
const { createHealthRouter } = require("./routes/health");
const { createTelegramRouter } = require("./routes/telegram");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error(`CORS: ${origin} ruxsat etilmagan`), false);
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      credentials: false,
    }),
  );

  app.use(express.json({ limit: "64kb" }));

  app.use(
    "/api/",
    rateLimit({
      windowMs: 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { ok: false, error: "Juda ko'p so'rov yuborildi. Biroz kuting." },
    }),
  );

  app.use(createHealthRouter());
  app.use(createTelegramRouter());

  return app;
}

module.exports = { createApp };
