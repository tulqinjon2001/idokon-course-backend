const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function sendTelegramMessage(botToken, chatId, text, opts = {}) {
  if (!botToken) throw new Error("BOT_TOKEN yo'q");
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...opts,
  };
  const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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

function formatQuizResultMessage({ name, phone, score, total, percent, passed }) {
  const pct = typeof percent === "number" ? percent : Math.round((score / total) * 100);
  const statusLine = passed ? "✅ Muvaffaqiyatli o'tdi" : "⚠️ Qayta urinishi kerak";

  return (
    `<b>IDOKON Quiz</b>\n` +
    `👤 <b>Ism:</b> ${esc(name)}\n` +
    `📱 <b>Tel:</b> ${esc(phone)}\n` +
    `🧮 <b>Natija:</b> ${score}/${total} (${pct}%)\n` +
    `📌 ${statusLine}`
  );
}

module.exports = {
  esc,
  sendTelegramMessage,
  formatQuizResultMessage,
};
