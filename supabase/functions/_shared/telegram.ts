export function esc(s = ""): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  opts: Record<string, unknown> = {},
): Promise<unknown> {
  if (!botToken) throw new Error("BOT_TOKEN yo'q");

  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...opts,
  };

  const resp = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Telegram API xatosi: ${t}`);
  }

  return resp.json();
}

export function formatQuizResultMessage({
  name = "",
  phone = "",
  score,
  total,
  percent,
  passed,
}: {
  name?: string;
  phone?: string;
  score: number;
  total: number;
  percent?: number;
  passed?: boolean;
}): string {
  const pct =
    typeof percent === "number" ? percent : Math.round((score / total) * 100);
  const statusLine = passed
    ? "✅ Muvaffaqiyatli o'tdi"
    : "⚠️ Qayta urinishi kerak";

  return (
    `<b>IDOKON Quiz</b>\n` +
    `👤 <b>Ism:</b> ${esc(name)}\n` +
    `📱 <b>Tel:</b> ${esc(phone)}\n` +
    `🧮 <b>Natija:</b> ${score}/${total} (${pct}%)\n` +
    `📌 ${statusLine}`
  );
}
