const { BOT_TOKEN, CHAT_ID, BOT_MODE } = require("../config/env");
const {
  sendTelegramMessage,
  formatQuizResultMessage,
} = require("../services/telegram");

function createTelegramRouter() {
  const express = require("express");
  const router = express.Router();

  router.post("/api/telegram-notify", async (req, res) => {
    try {
      const { name = "", phone = "", score, total, percent, passed } = req.body || {};

      if (typeof score !== "number" || typeof total !== "number") {
        return res.status(400).json({ ok: false, error: "score va total son bo'lishi kerak." });
      }
      if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({
          ok: false,
          error: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo'q.",
        });
      }

      const text = formatQuizResultMessage({ name, phone, score, total, percent, passed });
      await sendTelegramMessage(BOT_TOKEN, CHAT_ID, text);
      res.json({ ok: true });
    } catch (e) {
      console.error("[telegram-notify]", e.message);
      res.status(502).json({ ok: false, error: e.message });
    }
  });

  if (BOT_MODE === "webhook") {
    router.post("/api/telegram-webhook", (req, res) => {
      res.sendStatus(200);
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
            await sendTelegramMessage(
              BOT_TOKEN,
              chatId,
              "Salom! 👋 IDOKON Quiz botiga xush kelibsiz.",
            );
          }
        } catch (err) {
          console.error("[webhook-handler]", err.message);
        }
      })();
    });
  }

  return router;
}

module.exports = { createTelegramRouter };
