require('dotenv').config();
const { createBot } = require('./bot');
const { createServer } = require('./server');
const booking = require('./booking');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL; // masalan: https://sizning-domen.uz
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('XATO: .env faylida BOT_TOKEN ko\'rsatilmagan');
  process.exit(1);
}
if (!WEB_APP_URL) {
  console.error('XATO: .env faylida WEB_APP_URL ko\'rsatilmagan (https bo\'lishi shart)');
  process.exit(1);
}

const bot = createBot(BOT_TOKEN, WEB_APP_URL, ADMIN_CHAT_ID);
const app = createServer(bot, ADMIN_CHAT_ID);

app.listen(PORT, () => {
  console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});

bot.launch();
console.log('Telegram bot ishga tushdi');

// har 5 daqiqada to'lov qilinmagan eski bandlarni bo'shatib turadi
setInterval(() => booking.expireStalePayments(), 5 * 60 * 1000);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
