/**
 * Telegram webhook URL ni Supabase Edge Function ga o'rnatish.
 *
 * Talab: .env da TELEGRAM_BOT_TOKEN va SUPABASE_PROJECT_REF bo'lishi kerak.
 *
 * Ishlatish: npm run supabase:webhook
 */
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN .env da topilmadi.");
  process.exit(1);
}

if (!projectRef) {
  console.error("SUPABASE_PROJECT_REF .env da topilmadi.");
  console.error("Supabase Dashboard → Project Settings → General → Reference ID");
  process.exit(1);
}

const webhookUrl =
  `https://${projectRef}.supabase.co/functions/v1/telegram-webhook`;

async function main() {
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.ok) {
    console.error("Webhook o'rnatilmadi:", data);
    process.exit(1);
  }

  console.log("✅ Telegram webhook o'rnatildi:");
  console.log("  ", webhookUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
