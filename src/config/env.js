require("dotenv").config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PORT = process.env.PORT || 3001;
const BOT_MODE = (process.env.BOT_MODE || "webhook").toLowerCase();

const DEFAULT_ORIGINS = "http://localhost:5173,https://idokon-course.vercel.app";
const allowedOrigins = (process.env.FRONTEND_ORIGIN || DEFAULT_ORIGINS)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = {
  BOT_TOKEN,
  CHAT_ID,
  PORT,
  BOT_MODE,
  allowedOrigins,
};
