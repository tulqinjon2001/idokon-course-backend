import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { sendTelegramMessage } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse(req, { ok: false, error: "Faqat POST ruxsat etilgan." }, 405);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    return jsonResponse(req, { ok: false, error: "TELEGRAM_BOT_TOKEN yo'q." }, 500);
  }

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    return jsonResponse(req, { ok: true });
  }

  const processUpdate = async () => {
    try {
      const message =
        (update as { message?: { chat?: { id?: number }; text?: string } }).message ||
        (update as { channel_post?: { chat?: { id?: number }; text?: string } }).channel_post ||
        (update as { callback_query?: { message?: { chat?: { id?: number }; text?: string } } })
          .callback_query?.message ||
        null;

      if (!message) return;

      const chatId = message.chat?.id;
      const text = (message.text || "").trim();

      if (text.split(/\s+/)[0].toLowerCase() === "/start") {
        await sendTelegramMessage(
          botToken,
          chatId!,
          "Salom! 👋 IDOKON Quiz botiga xush kelibsiz.",
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Noma'lum xatolik";
      console.error("[telegram-webhook]", message);
    }
  };

  // @ts-ignore Supabase Edge Runtime
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(processUpdate());
  } else {
    await processUpdate();
  }

  return jsonResponse(req, { ok: true });
});
