// server.js — Idokon Quiz Backend (Node 18+, CommonJS)
//
// Yaxshilanishlar:
// ✅ POLLING va WEBHOOK bir vaqtda ishlamasligi uchun MODE env qo'shildi
//    BOT_MODE=polling  → development uchun (default)
//    BOT_MODE=webhook  → production uchun
// ✅ node-telegram-bot-api import faqat polling rejimda ishlatiladi
// ✅ Kod strukturasi tozalandi

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);

// ─── CORS ───────────────────────────────────────────────────
const DEFAULT_ORIGINS = "http://localhost:5173,https://idokon-course.vercel.app";
const allowedOrigins = (process.env.FRONTEND_ORIGIN || DEFAULT_ORIGINS)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/postman/server-to-server
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: ${origin} ruxsat etilmagan`), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

app.use(express.json({ limit: "64kb" }));

// ─── RATE LIMIT ─────────────────────────────────────────────
app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000, // 1 daqiqa
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Juda ko'p so'rov yuborildi. Biroz kuting." },
  })
);

// ─── ENV ────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PORT = process.env.PORT || 3001;

/**
 * BOT_MODE:
 *   "polling"  → TelegramBot library bilan polling (development)
 *   "webhook"  → Webhook endpoint orqali (production, default)
 *
 * Ikkalasi bir vaqtda HECH QACHON ishlatilmasin!
 */
const BOT_MODE = (process.env.BOT_MODE || "webhook").toLowerCase();

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "quiz-telegram", mode: BOT_MODE, time: new Date().toISOString() });
});

// ─── HTML ESCAPE ─────────────────────────────────────────────
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─── TELEGRAM XABAR YUBORISH ─────────────────────────────────
async function sendTelegramMessage(chatId, text, opts = {}) {
  if (!BOT_TOKEN) throw new Error("BOT_TOKEN yo'q");
  const body = { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...opts };
  const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Telegram API xatosi: ${t}`);
  }
  return resp.json();
}

// ─── API: TELEGRAM NOTIFY ────────────────────────────────────
app.post("/api/telegram-notify", async (req, res) => {
  try {
    const { name = "", phone = "", score, total, percent, passed } = req.body || {};

    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ ok: false, error: "score va total son bo'lishi kerak." });
    }
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo'q." });
    }

    const pct = typeof percent === "number" ? percent : Math.round((score / total) * 100);
    const statusLine = passed ? "✅ Muvaffaqiyatli o'tdi" : "⚠️ Qayta urinishi kerak";

    const text =
      `<b>IDOKON Quiz</b>\n` +
      `👤 <b>Ism:</b> ${esc(name)}\n` +
      `📱 <b>Tel:</b> ${esc(phone)}\n` +
      `🧮 <b>Natija:</b> ${score}/${total} (${pct}%)\n` +
      `📌 ${statusLine}`;

    await sendTelegramMessage(CHAT_ID, text);
    res.json({ ok: true });
  } catch (e) {
    console.error("[telegram-notify]", e.message);
    res.status(502).json({ ok: false, error: e.message });
  }
});

// ─── WEBHOOK ENDPOINT (faqat webhook rejimida aktiv) ─────────
if (BOT_MODE === "webhook") {
  app.post("/api/telegram-webhook", (req, res) => {
    res.sendStatus(200); // Telegram 200 kutadi
    (async () => {
      try {
        if (!BOT_TOKEN) return;
        const update = req.body || {};
        const message =
          update.message ||
          update.channel_post ||
          update.callback_query?.message ||
          null;
        if (!message) return;

        const chatId = message.chat?.id;
        const text = (message.text || "").trim();

        if (text.split(/\s+/)[0].toLowerCase() === "/start") {
          await sendTelegramMessage(chatId, "Salom! 👋 IDOKON Quiz botiga xush kelibsiz.");
        }
      } catch (err) {
        console.error("[webhook-handler]", err.message);
      }
    })();
  });
}

// ─── POLLING REJIM (faqat development uchun) ─────────────────
if (BOT_MODE === "polling") {
  if (!BOT_TOKEN) {
    console.warn("⚠️  BOT_MODE=polling lekin TELEGRAM_BOT_TOKEN yo'q!");
  } else {
    // Paket faqat polling rejimda import qilinadi
    const TelegramBot = require("node-telegram-bot-api");
    const bot = new TelegramBot(BOT_TOKEN, { polling: true });

    bot.onText(/\/start/i, (msg) => {
      bot.sendMessage(msg.chat.id, "🤖 IDOKON Quiz boti ishlayapti ✅");
      console.log(`[polling] /start — ${msg.from?.first_name} (${msg.chat.id})`);
    });

    bot.on("message", (msg) => {
      if (msg.text && !msg.text.startsWith("/")) {
        console.log(`[polling] yangi xabar: "${msg.text}" — from: ${msg.from?.first_name}`);
      }
    });

    bot.on("polling_error", (err) => {
      console.error("[polling_error]", err.code, err.message);
    });

    console.log("🤖 Telegram bot polling rejimda ishga tushdi.");
  }
}

// ─── SERVER ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Express server port ${PORT} da ishlayapti`);
  console.log(`   BOT_MODE: ${BOT_MODE}`);
  if (BOT_MODE === "webhook") {
    console.log(`   Webhook URL (o'rnatish kerak): POST /api/telegram-webhook`);
  }
});
