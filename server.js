// server.js (CommonJS, Node 18+ bilan ishlaydi)
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);

// CORS: faqat sizning frontend domen(lar)ingizga ruxsat
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, cb) {
      // local dev va postman/curl uchun origin bo'lmasligi mumkin
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("CORS: not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  })
);

// JSON body limit
app.use(express.json({ limit: "64kb" }));

// Rate limit (abuzni kamaytirish uchun)
app.use(
  "/api/",
  rateLimit({
    windowMs: 60 * 1000, // 1 daqiqa
    max: 30,             // 1 daqiqada 30 ta request
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Sog'liqni tekshirish
app.get("/healthz", (req, res) => {
  res.json({ ok: true, service: "quiz-telegram", time: new Date().toISOString() });
});

// Telegramga xabar yuborish
app.post("/api/telegram-notify", async (req, res) => {
  try {
    const { name = "", phone = "", score, total, percent, passed } = req.body || {};

    // Minimal validatsiya
    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ ok: false, error: "Invalid payload (score/total required)" });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" });
    }

    // HTML escape
    const esc = (s = "") =>
      String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const statusLine = passed ? "✅ Muvaffaqiyatli o‘tdi" : "⚠️ Qayta urinishi kerak";
    const text =
      `<b>IDOKON Quiz</b>\n` +
      `👤 <b>Ism:</b> ${esc(name)}\n` +
      `📱 <b>Tel:</b> ${esc(phone)}\n` +
      `🧮 <b>Natija:</b> ${score}/${total} (${typeof percent === "number" ? percent : Math.round((score/total)*100)}%)\n` +
      `📌 ${statusLine}`;

    // Node 18+ da fetch global mavjud
    const tgResp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!tgResp.ok) {
      const t = await tgResp.text();
      return res.status(502).json({ ok: false, error: "Telegram API error", details: t });
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Telegram notify server listening on port ${PORT}`);
});
