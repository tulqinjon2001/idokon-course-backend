const { BOT_TOKEN, PORT, BOT_MODE } = require("./config/env");
const { createApp } = require("./app");

function startPollingBot() {
  if (!BOT_TOKEN) {
    console.warn("⚠️  BOT_MODE=polling lekin TELEGRAM_BOT_TOKEN yo'q!");
    return;
  }

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

function startServer() {
  const app = createApp();

  if (BOT_MODE === "polling") {
    startPollingBot();
  }

  app.listen(PORT, () => {
    console.log(`✅ Express server port ${PORT} da ishlayapti`);
    console.log(`   BOT_MODE: ${BOT_MODE}`);
    if (BOT_MODE === "webhook") {
      console.log("   Webhook URL (o'rnatish kerak): POST /api/telegram-webhook");
    }
  });
}

startServer();
