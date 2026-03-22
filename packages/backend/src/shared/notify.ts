const TELEGRAM_BOT_TOKEN = '8585441220:AAEjBF34azYaKX52P0aIoFZ-gzM389tfWyI';
const TELEGRAM_CHAT_ID = '411146004';

export async function sendTelegramMessage(text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('[notify] Telegram notification failed:', err);
  }
}
