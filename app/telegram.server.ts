import * as process from 'process';

export async function sendToTelegram(message: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&parse_mode=Markdown&text=${encodeURIComponent(message)}`, { method: 'get' });
}
