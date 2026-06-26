import { handleCors, jsonResponse } from "../_shared/cors.ts";
import {
  formatQuizResultMessage,
  sendTelegramMessage,
} from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse(req, { ok: false, error: "Faqat POST ruxsat etilgan." }, 405);
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    const { name = "", phone = "", score, total, percent, passed } =
      await req.json();

    if (typeof score !== "number" || typeof total !== "number") {
      return jsonResponse(
        req,
        { ok: false, error: "score va total son bo'lishi kerak." },
        400,
      );
    }

    if (!botToken || !chatId) {
      return jsonResponse(
        req,
        { ok: false, error: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo'q." },
        500,
      );
    }

    const text = formatQuizResultMessage({
      name,
      phone,
      score,
      total,
      percent,
      passed,
    });

    await sendTelegramMessage(botToken, chatId, text);
    return jsonResponse(req, { ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Noma'lum xatolik";
    console.error("[telegram-notify]", message);
    return jsonResponse(req, { ok: false, error: message }, 502);
  }
});
